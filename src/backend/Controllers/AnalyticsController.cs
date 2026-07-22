using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Data;

namespace QrBillSplit.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary([FromQuery] string period = "daily")
    {
        var now = DateTime.UtcNow;
        var startDate = now.Date;
        var endDate = now.Date.AddDays(1);

        if (period.Equals("weekly", StringComparison.OrdinalIgnoreCase))
        {
            startDate = now.Date.AddDays(-7);
        }
        else if (period.Equals("monthly", StringComparison.OrdinalIgnoreCase))
        {
            startDate = now.Date.AddDays(-30);
        }
        else if (period.Equals("yearly", StringComparison.OrdinalIgnoreCase))
        {
            startDate = now.Date.AddDays(-365);
        }
        else if (period.Equals("debug", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new { Count = await _context.Receipts.CountAsync() });
        }

        // Fetch all receipts for the timeframe
        var receipts = await _context.Receipts
            .Include(r => r.OrderItems)
            .Where(r => r.OpenedAt >= startDate && r.OpenedAt < endDate)
            .ToListAsync();

        if (!receipts.Any())
        {
            return Ok(new { Message = $"No data for {period}." });
        }

        var totalRevenue = receipts.Sum(r => r.TotalAmount);
        var totalOrders = receipts.Count;
        var averageSpend = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 2) : 0;
        
        var totalTips = receipts.Sum(r => r.TipAmount);
        var averageSpendPerPerson = receipts.Any() ? Math.Round(receipts.Average(r => r.TotalAmount / (r.SplitWays > 0 ? r.SplitWays : 1)), 2) : 0;
        
        var totalMinutes = receipts.Sum(r => (r.ClosedAt - r.OpenedAt).TotalMinutes);
        var averageTableTimeMinutes = totalOrders > 0 ? (int)Math.Round(totalMinutes / totalOrders) : 0;
        
        var expenses = totalRevenue * 0.25m; // Mock 25% overhead
        var netProfit = totalRevenue - expenses;
        var cancellationsAndComps = totalRevenue * 0.03m; // Mock 3% leakage

        // Payment Methods Grouping
        var paymentGroups = receipts.GroupBy(r => r.PaymentMethod)
            .Select(g => new
            {
                name = g.Key == "QR" ? "QR Split App" : (g.Key == "POS" ? "Physical POS" : "Cash"),
                value = g.Sum(r => r.TotalAmount)
            }).ToList();

        // Split Rate Grouping
        var splitCount = receipts.Count(r => r.IsSplitPayment);
        var singleCount = totalOrders - splitCount;
        var splitRateData = new List<object>
        {
            new { name = "Single Payment", value = totalOrders > 0 ? (int)Math.Round((double)singleCount / totalOrders * 100) : 0, fill = "#E5E5EA" },
            new { name = "Split Bill", value = totalOrders > 0 ? (int)Math.Round((double)splitCount / totalOrders * 100) : 0, fill = "#2563EB" }
        };

        // Daily Revenue Timeline
        var incomeExpensesData = receipts
            .GroupBy(r => r.OpenedAt.Date)
            .Select(g => new
            {
                name = g.Key.ToString("dd MMM"),
                date = g.Key,
                Revenue = g.Sum(r => r.TotalAmount),
                Expenses = g.Sum(r => r.TotalAmount) * 0.25m
            })
            .OrderBy(g => g.date)
            .ToList();

        // Peak Hours (Group by Hour of Checkout)
        var peakHoursData = receipts
            .GroupBy(r => r.ClosedAt.Hour)
            .Select(g => new
            {
                time = $"{g.Key:00}:00",
                orders = g.Count()
            })
            .OrderBy(g => g.time)
            .ToList();

        // Fill in missing hours from 10 to 22 if they don't exist
        var finalPeakHours = new List<object>();
        for (int i = 10; i <= 22; i+=2)
        {
            var timeStr = $"{i:00}:00";
            var existing = peakHoursData.FirstOrDefault(p => p.time == timeStr || p.time == $"{(i+1):00}:00");
            finalPeakHours.Add(new
            {
                time = timeStr,
                orders = existing?.orders ?? 0
            });
        }

        // Top Items
        var topItemsData = receipts.SelectMany(r => r.OrderItems)
            .GroupBy(o => o.ProductName)
            .Select(g => new
            {
                name = g.Key,
                sales = g.Sum(o => o.Quantity),
                revenue = g.Sum(o => o.Price * o.Quantity)
            })
            .OrderByDescending(x => x.revenue)
            .Take(5)
            .ToList();

        var response = new
        {
            totalRevenue,
            totalOrders,
            averageSpend,
            averageSpendPerPerson,
            totalTips,
            averageTableTimeMinutes,
            netProfit,
            cancellationsAndComps,
            paymentMethodsData = paymentGroups,
            incomeExpensesData,
            splitRateData,
            peakHoursData = finalPeakHours,
            topItemsData
        };

        return Ok(response);
    }
}
