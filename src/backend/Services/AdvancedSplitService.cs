using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Services.Hubs;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Services;

/// <summary>
/// Implements advanced mathematical operations for bill splitting, strictly enforcing decimal precision and penny allocation.
/// </summary>
public class AdvancedSplitService : IAdvancedSplitService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public AdvancedSplitService(AppDbContext context, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    /// <inheritdoc />
    public async Task<Dictionary<string, decimal>> SplitSharedItemAsync(string tableId, int itemId, List<string> userIds)
    {
        if (userIds == null || userIds.Count == 0)
            throw new PaymentFailedException("Cannot split an item without users.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var item = await _context.BillItems.FirstOrDefaultAsync(i => i.Id == itemId && i.TableSessionId == tableId);
            if (item == null) throw new ResourceNotFoundException($"Bill item {itemId} not found.");
            if (item.IsPaid) throw new PaymentFailedException("Item is already paid.");

            decimal totalToSplit = item.Price - item.AmountPaid;
            if (totalToSplit <= 0) throw new PaymentFailedException("Item has no remaining balance to split.");

            int userCount = userIds.Count;
            decimal rawSplit = totalToSplit / userCount;
            
            // Step 1: Truncate to 2 decimal places using Math.Floor to avoid floating point anomalies natively
            decimal baseSplit = Math.Floor(rawSplit * 100) / 100m;

            var allocations = new Dictionary<string, decimal>();
            foreach (var userId in userIds)
            {
                allocations[userId] = baseSplit;
            }

            // Step 2: Penny Allocation Rule. Calculate leftover cents and give to the first user.
            decimal currentSum = baseSplit * userCount;
            decimal remainder = totalToSplit - currentSum;
            
            if (remainder > 0)
            {
                allocations[userIds[0]] += remainder;
            }

            // Step 3: Process the partial payments internally to avoid nested EF transactions
            foreach (var allocation in allocations)
            {
                if (allocation.Value > 0)
                {
                    item.AmountPaid += allocation.Value;
                    if (item.AmountPaid >= item.Price)
                    {
                        item.AmountPaid = item.Price;
                        item.IsPaid = true;
                        item.PaidByUserId = "Shared"; // Mark as shared split
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Broadcast the final state of the item to all clients
            await _hubContext.Clients.Group(tableId).SendAsync("ReceiveItemUpdate", item.Id, item.IsPaid, item.AmountPaid);
            await _hubContext.Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);

            await transaction.CommitAsync();
            return allocations;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc />
    public Dictionary<string, decimal> ApplyTaxAndTip(Dictionary<string, decimal> userBaseShares, decimal taxPercent, decimal tipPercent)
    {
        var finalTotals = new Dictionary<string, decimal>();
        if (userBaseShares == null || userBaseShares.Count == 0) return finalTotals;

        decimal totalBase = userBaseShares.Values.Sum();
        if (totalBase <= 0) return userBaseShares;

        // Calculate total absolute tax and tip globally
        decimal totalTax = Math.Round(totalBase * (taxPercent / 100m), 2, MidpointRounding.AwayFromZero);
        decimal totalTip = Math.Round(totalBase * (tipPercent / 100m), 2, MidpointRounding.AwayFromZero);
        
        decimal allocatedTax = 0m;
        decimal allocatedTip = 0m;

        var userIds = userBaseShares.Keys.ToList();

        // Pass 1: Proportional allocation
        foreach (var userId in userIds)
        {
            decimal userBase = userBaseShares[userId];
            decimal proportion = userBase / totalBase;

            decimal userTax = Math.Floor((totalTax * proportion) * 100) / 100m;
            decimal userTip = Math.Floor((totalTip * proportion) * 100) / 100m;

            finalTotals[userId] = userBase + userTax + userTip;

            allocatedTax += userTax;
            allocatedTip += userTip;
        }

        // Pass 2: Penny Allocation Rule for any lost cents in rounding
        decimal taxRemainder = totalTax - allocatedTax;
        decimal tipRemainder = totalTip - allocatedTip;

        if (taxRemainder > 0 || tipRemainder > 0)
        {
            finalTotals[userIds[0]] += (taxRemainder + tipRemainder);
        }

        return finalTotals;
    }
}
