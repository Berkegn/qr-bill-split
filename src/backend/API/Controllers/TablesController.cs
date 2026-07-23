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
    public async Task<ActionResult<TableSession>> GetTableSession(string tableId)
    {
        var session = await _context.TableSessions
            .Include(t => t.BillItems)
            .Include(t => t.Participants)
            .FirstOrDefaultAsync(t => t.Id == tableId);

        if (session == null)
        {
            throw new ResourceNotFoundException($"Table session {tableId} not found.");
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
}
