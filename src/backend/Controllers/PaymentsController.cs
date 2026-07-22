using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Data;
using Microsoft.AspNetCore.SignalR;
using QrBillSplit.Backend.Hubs;
using QrBillSplit.Backend.Models;
using System.Security.Claims;

namespace QrBillSplit.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public PaymentsController(AppDbContext context, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet("methods")]
    public async Task<IActionResult> GetSavedMethods()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var methods = await _context.UserPaymentMethods
            .Where(m => m.UserId == userId)
            .Select(m => new PaymentMethodResponseDto
            {
                Id = m.Id,
                CardBrand = m.CardBrand,
                CardLastFour = m.CardLastFour
            })
            .ToListAsync();

        return Ok(new { success = true, methods });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (string.IsNullOrEmpty(request.CardToken))
        {
            return BadRequest(new { success = false, message = "PCI-DSS Compliance Error: A valid CardToken is required." });
        }

        var session = await _context.TableSessions
            .Include(t => t.BillItems)
            .FirstOrDefaultAsync(t => t.Id == request.TableId);
            
        if (session == null) return NotFound("Table not found");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User identity not found in token.");
        }

        var userItems = session.BillItems.Where(i => i.LockedByUserId == userId && !i.IsPaid).ToList();
        if (!userItems.Any()) return BadRequest("No unpaid items locked by user.");

        // Simulate external payment gateway processing time (Stripe, Iyzico, etc.)
        await Task.Delay(1500);

        decimal baseTotal = 0;
        foreach(var item in userItems)
        {
            item.IsPaid = true;
            item.AmountPaid = item.Price; // Setting fully paid
            item.PaidByUserId = userId;
            baseTotal += item.Price;
        }

        await _context.SaveChangesAsync();

        // Broadcast to clients and dashboard
        foreach (var item in userItems)
        {
            await _hubContext.Clients.Group(request.TableId).SendAsync("ReceiveItemUpdate", item.Id, item.IsPaid, item.AmountPaid);
        }
        await _hubContext.Clients.Group("Admin").SendAsync("AdminTableUpdated", request.TableId);

        string transactionId = "TXN-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        
        var receipt = new ReceiptResponse
        {
            TransactionId = transactionId,
            Date = DateTime.UtcNow,
            BaseTotal = baseTotal,
            TaxAndTip = request.TaxAndTipAmount,
            GrandTotal = baseTotal + request.TaxAndTipAmount,
            Items = userItems.Select(i => new ReceiptItem { Name = i.Name, Price = i.Price }).ToList()
        };

        return Ok(new { success = true, receipt = receipt });
    }
}

public class CheckoutRequest
{
    public string TableId { get; set; } = string.Empty;
    public decimal TaxAndTipAmount { get; set; }
    public string CardToken { get; set; } = string.Empty;
}

public class ReceiptResponse
{
    public string TransactionId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal BaseTotal { get; set; }
    public decimal TaxAndTip { get; set; }
    public decimal GrandTotal { get; set; }
    public List<ReceiptItem> Items { get; set; } = new List<ReceiptItem>();
}

public class ReceiptItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
