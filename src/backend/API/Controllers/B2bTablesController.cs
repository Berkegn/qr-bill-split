using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/b2b/tables")]
public class B2bTablesController : ControllerBase
{
    private readonly IAppDbContext _context;

    public B2bTablesController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTables()
    {
        var tables = await _context.RestaurantTables.OrderBy(t => t.TableNumber).ToListAsync();
        return Ok(new { success = true, tables });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableRequest request)
    {
        var count = await _context.RestaurantTables.CountAsync();
        var newTable = new RestaurantTable
        {
            TableNumber = string.IsNullOrWhiteSpace(request?.TableNumber) ? $"Table {count + 1}" : request.TableNumber,
            SessionId = Guid.NewGuid(),
            IsOccupied = false,
            Status = 0
        };

        _context.RestaurantTables.Add(newTable);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, table = newTable });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTable(Guid id)
    {
        var table = await _context.RestaurantTables.FindAsync(id);
        if (table == null)
            return NotFound("Table not found.");

        // Clean up receipts and their order items
        var receipts = await _context.Receipts.Where(r => r.TableId == id).ToListAsync();
        if (receipts.Any())
        {
            var receiptIds = receipts.Select(r => r.Id).ToList();
            var orderItems = await _context.OrderItems.Where(oi => receiptIds.Contains(oi.ReceiptId)).ToListAsync();
            _context.OrderItems.RemoveRange(orderItems);
            _context.Receipts.RemoveRange(receipts);
        }

        // Clean up table sessions and their bill items / participants
        var sessionId = table.SessionId.ToString();
        var sessions = await _context.TableSessions
            .Include(s => s.BillItems)
            .Include(s => s.Participants)
            .Where(s => s.Id == sessionId || s.TableId == id)
            .ToListAsync();
        foreach (var session in sessions)
        {
            _context.BillItems.RemoveRange(session.BillItems);
            _context.Participants.RemoveRange(session.Participants);
        }
        _context.TableSessions.RemoveRange(sessions);

        _context.RestaurantTables.Remove(table);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPost("{sessionId}/items")]
    public async Task<IActionResult> AddPosItem(Guid sessionId, [FromBody] AddPosItemRequest request)
    {
        var sessionIdString = sessionId.ToString();
        var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.SessionId == sessionId);
        if (table == null)
            return NotFound(new { success = false, message = "Table not found." });

        var session = await _context.TableSessions.Include(s => s.BillItems).FirstOrDefaultAsync(s => s.Id == sessionIdString);
        if (session == null)
        {
            session = new TableSession
            {
                Id = sessionIdString,
                TableName = table.TableNumber
            };
            _context.TableSessions.Add(session);
        }

        // Add quantity number of atomic BillItems
        for (int i = 0; i < request.Quantity; i++)
        {
            var billItem = new BillItem
            {
                Name = request.Name,
                Price = request.Price,
                TableSessionId = sessionIdString,
                IsPaid = false,
                AmountPaid = 0m
            };
            session.BillItems.Add(billItem);
            session.TotalAmount += request.Price;
        }

        table.IsOccupied = true;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, items = session.BillItems });
    }
}

public class AddPosItemRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CreateTableRequest
{
    public string? TableNumber { get; set; }
}
