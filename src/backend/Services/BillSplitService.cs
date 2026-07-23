using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Services.Hubs;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Services;

public class BillSplitService : IBillSplitService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public BillSplitService(AppDbContext context, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    /// <inheritdoc />
    public async Task<bool> PayPartialAsync(string tableId, int itemId, decimal amount, string payingUserId)
    {
        if (amount <= 0) throw new PaymentFailedException("Payment amount must be greater than zero.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var item = await _context.BillItems.FirstOrDefaultAsync(i => i.Id == itemId && i.TableSessionId == tableId);
            if (item == null) throw new ResourceNotFoundException($"Bill item {itemId} not found.");
            if (item.IsPaid) throw new PaymentFailedException("This item is already fully paid.");

            // Add to amount paid
            item.AmountPaid += amount;

            // If the item is fully paid off (or overpaid)
            if (item.AmountPaid >= item.Price)
            {
                item.AmountPaid = item.Price; // Normalize
                item.IsPaid = true;
                item.PaidByUserId = payingUserId;
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group(tableId).SendAsync("ReceiveItemUpdate", item.Id, item.IsPaid, item.AmountPaid);
            await _hubContext.Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);
            
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<Dictionary<string, decimal>> SplitRemainingAsync(string tableId, List<string> userIds)
    {
        var result = new Dictionary<string, decimal>();
        if (userIds == null || userIds.Count == 0) throw new PaymentFailedException("No users provided for split.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var unpaidItems = await _context.BillItems
                .Where(i => i.TableSessionId == tableId && !i.IsPaid)
                .ToListAsync();

            if (!unpaidItems.Any()) throw new PaymentFailedException("No unpaid items left to split.");

            // Calculate total unpaid amount securely
            decimal totalRemaining = unpaidItems.Sum(i => i.Price - i.AmountPaid);
            if (totalRemaining <= 0) throw new PaymentFailedException("Total remaining amount is zero or less.");

            // Divide equally
            int userCount = userIds.Count;
            decimal rawSplit = totalRemaining / userCount;
            
            // Truncate to 2 decimal places using Math.Floor to avoid floating point anomalies natively
            decimal baseSplit = Math.Floor(rawSplit * 100) / 100m;
            
            // Distribute the base amount
            foreach (var userId in userIds)
            {
                result[userId] = baseSplit;
            }

            // Calculate the leftover cents
            decimal currentSum = baseSplit * userCount;
            decimal difference = totalRemaining - currentSum;

            // Safely add remainder to the first user
            if (difference > 0)
            {
                result[userIds[0]] += difference;
            }

            // Mark items as paid
            foreach (var item in unpaidItems)
            {
                item.AmountPaid = item.Price;
                item.IsPaid = true;
                item.PaidByUserId = "GroupSplit";
            }

            await _context.SaveChangesAsync();
            
            // Broadcast all paid items
            foreach (var item in unpaidItems)
            {
                await _hubContext.Clients.Group(tableId).SendAsync("ReceiveItemUpdate", item.Id, item.IsPaid, item.AmountPaid);
            }
            await _hubContext.Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);

            await transaction.CommitAsync();
            return result;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<RouletteResult?> PlayRouletteAsync(string tableId, List<string> participantIds)
    {
        if (participantIds == null || participantIds.Count == 0) throw new PaymentFailedException("No participants provided for roulette.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var unpaidItems = await _context.BillItems
                .Where(i => i.TableSessionId == tableId && !i.IsPaid && string.IsNullOrEmpty(i.LockedByUserId))
                .ToListAsync();

            if (!unpaidItems.Any()) throw new PaymentFailedException("No unpaid and unlocked items available for roulette.");

            // Randomly pick a participant
            var random = new Random();
            var loserId = participantIds[random.Next(participantIds.Count)];

            // Randomly pick an unpaid item
            var item = unpaidItems[random.Next(unpaidItems.Count)];

            item.LockedByUserId = loserId;
            await _context.SaveChangesAsync();

            var result = new RouletteResult
            {
                LoserUserId = loserId,
                ItemId = item.Id,
                Amount = item.Price,
                ItemName = item.Name
            };

            await _hubContext.Clients.Group(tableId).SendAsync("ReceiveRouletteResult", result.LoserUserId, result.ItemId, result.ItemName, result.Amount);
            await _hubContext.Clients.Group(tableId).SendAsync("ItemLocked", item.Id, loserId);
            await _hubContext.Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);

            await transaction.CommitAsync();
            return result;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
