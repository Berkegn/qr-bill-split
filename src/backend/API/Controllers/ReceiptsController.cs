using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;
using QrBillSplit.Backend.Services.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ILogger<ReceiptsController> _logger;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public ReceiptsController(IAppDbContext context, ILogger<ReceiptsController> logger, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Processes a checkout and generates a receipt.
    /// </summary>
    [HttpPost("checkout")]
    [Consumes("application/json")]
    public async Task<IActionResult> Checkout([FromBody] ReceiptCheckoutRequest request)
    {
        _logger.LogInformation("Received checkout request for TableId: {TableId}, Amount: {Amount}", request?.TableId, request?.TotalAmount);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state: {@ModelState}", ModelState);
            return BadRequest(new { success = false, message = "Invalid checkout request payload.", errors = ModelState });
        }

        if (request == null || request.OrderItems == null || request.OrderItems.Count == 0)
        {
            _logger.LogWarning("Checkout request is null or has no items.");
            return BadRequest(new { success = false, message = "Invalid checkout request payload." });
        }

        Guid parsedTableId;
        if (!Guid.TryParse(request.TableId, out parsedTableId))
        {
            _logger.LogWarning("Failed to parse TableId '{TableId}' as Guid. Using Guid.Empty.", request.TableId);
            parsedTableId = Guid.Empty;
        }

        var now = DateTime.UtcNow;

        var receipt = new Receipt
        {
            Id = Guid.NewGuid(),
            TableId = parsedTableId,
            TotalAmount = request.TotalAmount,
            PaymentMethod = request.PaymentMethod ?? "UNKNOWN",
            IsSplitPayment = request.IsSplitPayment,
            OpenedAt = now,
            ClosedAt = now, // Since this is checkout, it's closed immediately
            TipAmount = request.TipAmount,
            SplitWays = request.SplitWays > 0 ? request.SplitWays : 1,
            OrderItems = new List<OrderItem>()
        };

        foreach (var itemDto in request.OrderItems)
        {
            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                ReceiptId = receipt.Id,
                ProductName = itemDto.ProductName ?? "Unknown Item",
                Price = itemDto.Price,
                Quantity = itemDto.Quantity
            };
            receipt.OrderItems.Add(orderItem);
        }

        _context.Receipts.Add(receipt);
        
        try
        {
            await _context.SaveChangesAsync();

            // After successful payment: close table session and reset table
            if (parsedTableId != Guid.Empty)
            {
                var table = await _context.RestaurantTables.FirstOrDefaultAsync(t => t.Id == parsedTableId || t.SessionId == parsedTableId);
                
                if (table != null)
                {
                    // Close all active sessions for this table
                    var sessionId = table.SessionId.ToString();
                    var sessions = await _context.TableSessions
                        .Where(s => s.Id == sessionId || s.TableId == table.Id)
                        .Where(s => s.IsActive)
                        .ToListAsync();

                    foreach (var session in sessions)
                    {
                        session.IsActive = false;
                    }

                    // Reset table to Available
                    table.Status = 0;
                    table.IsOccupied = false;
                    table.Occupants.Clear();
                    table.SessionId = Guid.NewGuid(); // New session ID for next usage

                    await _context.SaveChangesAsync();

                    // Broadcast table cleared to web dashboard
                    await _hubContext.Clients.All.SendAsync("OnTableCleared", new 
                    { 
                        TableId = table.Id.ToString(),
                        TableNumber = table.TableNumber
                    });

                    // Also fire existing TableStatusUpdated for backward compat
                    await _hubContext.Clients.All.SendAsync("TableStatusUpdated", table);

                    _logger.LogInformation("Table {TableId} cleared after checkout.", table.Id);
                }
            }

            return Ok(new { success = true, receiptId = receipt.Id, message = "Checkout successful." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing checkout.");
            return StatusCode(500, new { success = false, message = "An error occurred while saving the receipt.", details = ex.Message });
        }
    }
}

public class ReceiptCheckoutRequest
{
    public string TableId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public bool IsSplitPayment { get; set; }
    public decimal TipAmount { get; set; } = 0m;
    public int SplitWays { get; set; } = 1;
    public List<OrderItemDto> OrderItems { get; set; } = new List<OrderItemDto>();
}

public class OrderItemDto
{
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}
