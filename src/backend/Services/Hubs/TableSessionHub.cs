using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Services.Hubs;

public class TableSessionHub : Hub
{
    private readonly AppDbContext _context;

    public TableSessionHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task JoinTableGroup(string tableId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, tableId);
    }

    public async Task OccupyTable(Guid tableId, string occupantName)
    {
        var table = await _context.RestaurantTables.FindAsync(tableId);
        if (table != null)
        {
            table.Status = 1; // Occupied
            if (!table.Occupants.Contains(occupantName))
            {
                table.Occupants.Add(occupantName);
            }
            table.IsOccupied = true;
            await _context.SaveChangesAsync();

            await Clients.All.SendAsync("TableStatusUpdated", table);
        }
    }

    public async Task JoinStaffGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Staff");
    }

    public async Task CallWaiter(string tableId)
    {
        await Clients.Group("Staff").SendAsync("WaiterCalled", tableId);
    }

    public async Task SendOrderToKitchen(string tableId, SignalRMenuItem item)
    {
        var session = await _context.TableSessions
            .Include(s => s.BillItems)
            .FirstOrDefaultAsync(s => s.Id == tableId);

        if (session != null)
        {
            var billItem = new BillItem
            {
                Name = item.Name,
                Price = item.Price,
                TableSessionId = tableId,
                IsPaid = false,
                AmountPaid = 0m
            };
            session.BillItems.Add(billItem);
            session.TotalAmount += item.Price;
            await _context.SaveChangesAsync();

            await Clients.Group(tableId).SendAsync("OrderUpdated");
        }
    }

    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Admin");
    }

    public async Task SelectItemToPay(string tableId, int itemId, string userId)
    {
        var item = await _context.BillItems.FindAsync(itemId);
        if (item != null && (string.IsNullOrEmpty(item.LockedByUserId) || item.LockedUntil < DateTime.UtcNow))
        {
            item.LockedByUserId = userId;
            item.LockedUntil = DateTime.UtcNow.AddMinutes(3);
            await _context.SaveChangesAsync();

            await Clients.Group(tableId).SendAsync("ItemLocked", itemId, userId, item.LockedUntil);
            await Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);
        }
    }

    public async Task UnselectItemToPay(string tableId, int itemId, string userId)
    {
        var item = await _context.BillItems.FindAsync(itemId);
        if (item != null && item.LockedByUserId == userId)
        {
            item.LockedByUserId = null;
            item.LockedUntil = null;
            await _context.SaveChangesAsync();

            await Clients.Group(tableId).SendAsync("ItemUnlocked", itemId);
            await Clients.Group("Admin").SendAsync("AdminTableUpdated", tableId);
        }
    }
}

public class SignalRMenuItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
