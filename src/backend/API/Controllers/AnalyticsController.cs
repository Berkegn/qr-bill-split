using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Infrastructure.Data;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAppDbContext _context;

    public AnalyticsController(IAppDbContext context)
    {
        _context = context;
    }

    // GET /api/analytics/daily-summary?days=30
    // Also backwards-compatible: ?period=weekly|monthly|yearly|daily
    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary(
        [FromQuery] int days = 30,
        [FromQuery] string period = "monthly")
    {
        // Backwards-compat: if old 'period' param is used, map to days
        if (days == 30)
        {
            days = period switch
            {
                "daily" => 1,
                "weekly" => 7,
                "monthly" => 30,
                "yearly" => 365,
                _ => 30
            };
        }

        var now = DateTime.UtcNow;
        var startDate = now.Date.AddDays(-days);
        var endDate = now.Date.AddDays(1);

        var receipts = await _context.Receipts
            .Include(r => r.OrderItems)
            .Include(r => r.Table)
            .Where(r => r.OpenedAt >= startDate && r.OpenedAt < endDate)
            .ToListAsync();

        var totalRevenue = receipts.Sum(r => r.TotalAmount);
        var totalOrders = receipts.Count;

        var sessionsWithDuration = receipts.Where(r => r.ClosedAt > r.OpenedAt).ToList();
        var avgSessionMinutes = sessionsWithDuration.Any()
            ? sessionsWithDuration.Average(r => (r.ClosedAt - r.OpenedAt).TotalMinutes)
            : 0;

        // Revenue by day
        var revenueByDay = receipts
            .GroupBy(r => r.OpenedAt.Date)
            .Select(g => new
            {
                date = g.Key.ToString("dd MMM"),
                revenue = (double)g.Sum(r => r.TotalAmount)
            })
            .OrderBy(g => g.date)
            .ToList();

        // Revenue by table
        var revenueByTable = receipts
            .Where(r => r.Table != null)
            .GroupBy(r => r.Table!.TableNumber)
            .Select(g => new
            {
                tableName = g.Key,
                revenue = (double)g.Sum(r => r.TotalAmount),
                orders = g.Count(),
                avgMinutes = g.Where(r => r.ClosedAt > r.OpenedAt)
                              .Any()
                    ? g.Where(r => r.ClosedAt > r.OpenedAt)
                       .Average(r => (r.ClosedAt - r.OpenedAt).TotalMinutes)
                    : 0.0
            })
            .OrderByDescending(t => t.revenue)
            .ToList();

        // Top products
        var topProducts = receipts
            .SelectMany(r => r.OrderItems)
            .GroupBy(o => o.ProductName)
            .Select(g => new
            {
                name = g.Key,
                count = g.Sum(o => o.Quantity),
                revenue = (double)g.Sum(o => o.Price * o.Quantity)
            })
            .OrderByDescending(x => x.count)
            .Take(8)
            .ToList();

        var topProduct = topProducts.FirstOrDefault()?.name ?? "—";

        // Payment methods
        var paymentMethods = receipts
            .GroupBy(r => r.PaymentMethod ?? "Bilinmiyor")
            .Select(g => new
            {
                method = g.Key switch
                {
                    "QR" => "QR Split",
                    "POS" => "Kart/POS",
                    "Nakit" or "Cash" => "Nakit",
                    _ => g.Key
                },
                count = g.Count()
            })
            .ToList();

        // Legacy response fields for backwards-compat
        var averageSpend = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 2) : 0;
        var averageSpendPerPerson = receipts.Any() ? Math.Round((decimal)receipts.Average(r => (double)r.TotalAmount / (r.SplitWays > 0 ? r.SplitWays : 1)), 2) : 0;
        var totalTips = receipts.Sum(r => r.TipAmount);
        var averageTableTimeMinutes = (int)Math.Round(avgSessionMinutes);
        var netProfit = totalRevenue * 0.75m;
        var cancellationsAndComps = totalRevenue * 0.03m;

        var paymentGroups = receipts
            .GroupBy(r => r.PaymentMethod)
            .Select(g => new { name = g.Key == "QR" ? "QR Split App" : (g.Key == "POS" ? "Kart/POS" : "Nakit"), value = g.Sum(r => r.TotalAmount) })
            .ToList();
        var splitCount = receipts.Count(r => r.IsSplitPayment);
        var singleCount = totalOrders - splitCount;
        var splitRateData = new List<object>
        {
            new { name = "Tek Ödeme", value = totalOrders > 0 ? (int)Math.Round((double)singleCount / totalOrders * 100) : 0, fill = "#E5E5EA" },
            new { name = "Hesap Paylaşımı", value = totalOrders > 0 ? (int)Math.Round((double)splitCount / totalOrders * 100) : 0, fill = "#2563EB" }
        };
        var incomeExpensesData = receipts
            .GroupBy(r => r.OpenedAt.Date)
            .Select(g => new { name = g.Key.ToString("dd MMM"), date = g.Key, Revenue = g.Sum(r => r.TotalAmount), Expenses = g.Sum(r => r.TotalAmount) * 0.25m })
            .OrderBy(g => g.date)
            .ToList();
        var peakHoursData = new List<object>();
        for (int i = 10; i <= 22; i += 2)
        {
            var hour = i;
            var orders = receipts.Count(r => r.ClosedAt.Hour == hour || r.ClosedAt.Hour == hour + 1);
            peakHoursData.Add(new { time = $"{hour:00}:00", orders });
        }
        var topItemsData = topProducts.Take(5).Select(p => new { name = p.name, sales = p.count, revenue = p.revenue }).ToList();

        return Ok(new
        {
            // New fields for Analytics.tsx
            totalRevenue,
            avgSessionMinutes,
            totalOrders,
            topProduct,
            revenueByDay,
            revenueByTable,
            topProducts,
            paymentMethods,
            // Legacy fields for Dashboard.tsx backwards-compat
            averageSpend,
            averageSpendPerPerson,
            totalTips,
            averageTableTimeMinutes,
            netProfit,
            cancellationsAndComps,
            paymentMethodsData = paymentGroups,
            incomeExpensesData,
            splitRateData,
            peakHoursData,
            topItemsData
        });
    }

    // GET /api/analytics/history
    // Returns the 50 most recently completed table sessions
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var sessions = await _context.Receipts
            .Include(r => r.OrderItems)
            .Include(r => r.Table)
            .Where(r => r.ClosedAt > r.OpenedAt) // completed sessions only
            .OrderByDescending(r => r.ClosedAt)
            .Take(50)
            .Select(r => new
            {
                tableNumber = r.Table != null ? r.Table.TableNumber : "—",
                totalPaid = r.TotalAmount,
                checkoutTime = r.ClosedAt,
                itemCount = r.OrderItems.Sum(o => o.Quantity),
                durationMinutes = (r.ClosedAt - r.OpenedAt).TotalMinutes
            })
            .ToListAsync();

        var totalRevenue = await _context.Receipts.SumAsync(r => r.TotalAmount);
        var completedCount = await _context.Receipts.CountAsync(r => r.ClosedAt > r.OpenedAt);

        return Ok(new
        {
            success = true,
            sessions,
            summary = new
            {
                totalRevenue,
                completedSessionCount = completedCount
            }
        });
    }
}
