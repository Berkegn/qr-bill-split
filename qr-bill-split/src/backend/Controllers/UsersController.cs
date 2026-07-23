using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace QrBillSplit.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
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
