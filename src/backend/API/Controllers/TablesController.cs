using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QRCoder;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.API.Controllers;

/// <summary>
/// Controller for managing active table sessions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly IAppDbContext _context;

    public TablesController(IAppDbContext context)
    {
        _context = context;
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

}

public class OccupyTableRequest
{
    public string ParticipantName { get; set; } = string.Empty;
}
