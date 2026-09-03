using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QRCoder;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;
using QrBillSplit.Backend.Services.Hubs;


namespace QrBillSplit.Backend.API.Controllers;

/// <summary>
/// Controller for managing active table sessions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly IAppDbContext _context;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public TablesController(IAppDbContext context, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Retrieves the current session data for a specific table.
    /// </summary>
    [HttpGet("{tableId}")]
    public async Task<IActionResult> GetTableSession(string tableId)
    {
        var session = await _context.TableSessions
            .Include(t => t.BillItems)
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == tableId);

        if (session == null && Guid.TryParse(tableId, out var tableGuid))
        {
            var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableGuid);
            if (table != null)
            {
                session = await _context.TableSessions
                    .Include(t => t.BillItems)
                    .Include(t => t.Participants)
                    .FirstOrDefaultAsync(t => t.Id == table.SessionId.ToString());
            }
        }

        if (session == null)
        {
            return Ok(new { success = true, billItems = new List<BillItem>() }); // Return empty state instead of 404/500 to prevent mobile crashes
        }

        return Ok(session);
    }

    /// <summary>
    /// Retrieves all active table sessions.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TableSession>>> GetAllTables()
    {
        var sessions = await _context.TableSessions
            .Include(t => t.BillItems)
            .Include(t => t.Participants)
            .ToListAsync();

        return Ok(new { success = true, tables = sessions });
    }
    [HttpGet("{tableId}/qr")]
    public IActionResult GenerateQrCode(string tableId)
    {
        var deepLink = $"qrbillsplit://table/{tableId}";
        
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(deepLink, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        
        var qrCodeImage = qrCode.GetGraphic(20);
        return File(qrCodeImage, "image/png");
    }

    [HttpPost("{tableId}/occupy")]
    public async Task<IActionResult> OccupyTable(Guid tableId, [FromBody] OccupyTableRequest request)
    {
        var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableId || t.SessionId == tableId);
        if (table == null) return NotFound(new { success = false, message = "Table not found." });

        table.Status = 1;
        table.IsOccupied = true;
        
        if (!string.IsNullOrWhiteSpace(request.ParticipantName))
        {
            if (table.Occupants == null) table.Occupants = new List<string>();
            if (!table.Occupants.Contains(request.ParticipantName))
                table.Occupants.Add(request.ParticipantName);
        }

        var sessionString = table.SessionId.ToString();
        var session = await _context.TableSessions.FirstOrDefaultAsync(s => s.Id == sessionString);
        if (session == null)
        {
            session = new TableSession
            {
                Id = sessionString,
                TableName = table.TableNumber
            };
            _context.TableSessions.Add(session);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, table, session });
    }

    [HttpGet("{tableId}/orders")]
    public async Task<IActionResult> GetTableOrders(Guid tableId)
    {
        var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableId || t.SessionId == tableId);
        if (table == null) return NotFound(new { success = false, message = "Table not found." });

        var sessionString = table.SessionId.ToString();
        var session = await _context.TableSessions.Include(s => s.BillItems).FirstOrDefaultAsync(s => s.Id == sessionString);
        if (session == null) return Ok(new { success = true, orders = new List<BillItem>() });

        return Ok(new { success = true, orders = session.BillItems });
    }

    [HttpPost("{tableId}/call-waiter")]
    public async Task<IActionResult> CallWaiter(string tableId)
    {
        string tableNumber = "Unknown";
        string resolvedTableId = tableId;

        if (Guid.TryParse(tableId, out var tableGuid))
        {
            var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableGuid || t.SessionId == tableGuid);
            if (table != null)
            {
                tableNumber = table.TableNumber;
                resolvedTableId = table.Id.ToString();
            }
        }

        await _hubContext.Clients.All.SendAsync("OnWaiterCalled", new 
        { 
            TableId = resolvedTableId,
            TableNumber = tableNumber,
            CalledAt = DateTime.UtcNow
        });

        return Ok(new { success = true, message = "Waiter called." });
    }

    [HttpPost("{tableId}/join")]
    public async Task<IActionResult> JoinTable(string tableId, [FromBody] JoinTableRequest request)
    {
        RestaurantTable table = null;
        if (Guid.TryParse(tableId, out var tableGuid))
        {
            table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableGuid || t.SessionId == tableGuid);
        }
        
        var existingSession = await _context.TableSessions.FirstOrDefaultAsync(s => s.Id == tableId);
        
        if (table == null && existingSession != null && existingSession.TableId.HasValue) 
        {
            table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == existingSession.TableId.Value);
        }

        if (table == null && existingSession == null) 
            return NotFound(new { success = false, message = "Table not found." });

        if (table != null)
        {
            table.Status = 1;
            table.IsOccupied = true;
            
            if (!string.IsNullOrWhiteSpace(request.UserName))
            {
                if (table.Occupants == null) table.Occupants = new List<string>();
                if (!table.Occupants.Contains(request.UserName))
                    table.Occupants.Add(request.UserName);
            }
        }

        var sessionString = table != null ? table.SessionId.ToString() : existingSession.Id;
        var session = await _context.TableSessions.FirstOrDefaultAsync(s => s.Id == sessionString && s.IsActive);
        
        if (session == null && existingSession != null)
        {
            session = existingSession;
            session.IsActive = true;
        }

        if (session == null)
        {
            sessionString = Guid.NewGuid().ToString();
            if (table != null) table.SessionId = Guid.Parse(sessionString);
            session = new TableSession
            {
                Id = sessionString,
                TableName = table?.TableNumber ?? "Unknown Table",
                TableId = table?.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.TableSessions.Add(session);
        }

        var participant = new Participant
        {
            Name = request.UserName,
            TableSessionId = session.Id,
            JoinedAt = DateTime.UtcNow
        };
        _context.Participants.Add(participant);

        await _context.SaveChangesAsync();

        // Broadcast to all web dashboard clients via SignalR
        await _hubContext.Clients.All.SendAsync("OnTableOccupied", new 
        { 
            TableId = table?.Id.ToString() ?? "",
            SessionId = session.Id,
            Status = "Dolu",
            ParticipantName = request.UserName,
            TableNumber = table?.TableNumber ?? session.TableName
        });

        // Also fire existing TableStatusUpdated for backward compat
        if (table != null)
        {
            await _hubContext.Clients.All.SendAsync("TableStatusUpdated", table);
        }
        
        return Ok(new 
        { 
            success = true, 
            sessionId = session.Id, 
            userId = participant.Id,
            table = table
        });
    }

    [HttpPost("{tableId}/orders")]
    public async Task<IActionResult> SubmitOrders(string tableId, [FromBody] SubmitOrdersRequest request)
    {
        if (request.Items == null || !request.Items.Any())
            return BadRequest(new { success = false, message = "No items provided." });

        // Resolve the table
        RestaurantTable? table = null;
        if (Guid.TryParse(tableId, out var tableGuid))
        {
            table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == tableGuid || t.SessionId == tableGuid);
        }

        // Resolve session
        string sessionId;
        TableSession? session = null;

        if (table != null)
        {
            sessionId = table.SessionId.ToString();
            session = await _context.TableSessions
                .Include(s => s.BillItems)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }
        else
        {
            session = await _context.TableSessions
                .Include(s => s.BillItems)
                .FirstOrDefaultAsync(s => s.Id == tableId);
            sessionId = tableId;
        }

        if (session == null)
        {
            sessionId = table != null ? table.SessionId.ToString() : Guid.NewGuid().ToString();
            session = new TableSession
            {
                Id = sessionId,
                TableName = table?.TableNumber ?? "Unknown Table",
                TableId = table?.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.TableSessions.Add(session);
        }

        // Add items as BillItems
        foreach (var item in request.Items)
        {
            for (int i = 0; i < item.Quantity; i++)
            {
                var billItem = new BillItem
                {
                    Name = item.Name,
                    Price = item.Price,
                    TableSessionId = session.Id,
                    IsPaid = false,
                    AmountPaid = 0m
                };
                session.BillItems.Add(billItem);
                session.TotalAmount += item.Price;
            }
        }

        if (table != null)
        {
            table.IsOccupied = true;
            table.Status = 1;
        }

        await _context.SaveChangesAsync();

        // Broadcast order update via SignalR
        await _hubContext.Clients.All.SendAsync("OrderUpdated", sessionId);

        return Ok(new { success = true, sessionId = session.Id, items = session.BillItems });
    }

}

public class JoinTableRequest
{
    public string UserName { get; set; } = string.Empty;
}

public class OccupyTableRequest
{
    public string ParticipantName { get; set; } = string.Empty;
}

public class SubmitOrdersRequest
{
    public List<SubmitOrderItem> Items { get; set; } = new();
}

public class SubmitOrderItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
}
