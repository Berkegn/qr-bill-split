using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IAppDbContext _context;

    public UsersController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me/history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var paidItems = await _context.BillItems
            .Include(b => b.TableSession)
            .Where(b => b.PaidByUserId == userId && b.IsPaid)
            .OrderByDescending(b => b.Id)
            .ToListAsync();

        var history = paidItems.Select(b => new
        {
            b.Id,
            b.Name,
            b.Price,
            b.TableSessionId,
            TableName = b.TableSession?.TableName ?? "Unknown Table"
        });

        return Ok(new { success = true, history });
    }

    [HttpGet("me/friends")]
    public async Task<IActionResult> GetFriends()
    {
        // Mock friends list for demo purposes
        var friends = new List<object>
        {
            new { Id = "friend_1", Name = "Ahmet" },
            new { Id = "friend_2", Name = "Ayşe" },
            new { Id = "friend_3", Name = "Can" },
            new { Id = "friend_4", Name = "Elif" }
        };

        return Ok(new { success = true, friends });
    }
}
