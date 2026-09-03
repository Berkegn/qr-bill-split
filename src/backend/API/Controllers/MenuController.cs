using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Services.Hubs;

namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly IAppDbContext _context;
    private readonly IHubContext<TableSessionHub> _hubContext;

    public MenuController(IAppDbContext context, IHubContext<TableSessionHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    /// <summary>
    /// POST /api/menu/upload-parse
    /// Accepts a PDF or image file, runs a stub parser to simulate OCR extraction,
    /// bulk-inserts new products into the DB, and broadcasts OnMenuUpdated via SignalR.
    /// Replace the stub parser with a real OCR/AI service in production.
    /// </summary>
    [HttpPost("upload-parse")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB limit
    public async Task<IActionResult> UploadParse(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "Lütfen bir PDF veya görsel dosyası yükleyin." });

        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { success = false, message = "Yalnızca PDF, JPEG ve PNG dosyaları desteklenmektedir." });

        // ── Stub Parser ────────────────────────────────────────────────────────
        // In production: send file bytes to Azure Form Recognizer / Google Document AI
        // and parse the structured response into ParsedCategory objects.
        // For now we simulate a realistic extraction result.
        var parsedCategories = StubParseMenu(file.FileName);
        // ───────────────────────────────────────────────────────────────────────

        var addedProducts = new List<Product>();
        foreach (var category in parsedCategories)
        {
            foreach (var item in category.Items)
            {
                // Avoid duplicates by name+category
                var exists = _context.Products.Any(p =>
                    p.Name == item.Name && p.Category == category.CategoryName);
                if (!exists)
                {
                    var product = new Product
                    {
                        Name = item.Name,
                        Price = item.Price,
                        Category = category.CategoryName,
                        Description = item.Description
                    };
                    _context.Products.Add(product);
                    addedProducts.Add(product);
                }
            }
        }

        await _context.SaveChangesAsync();

        // Broadcast menu update to all connected clients (mobile + web)
        await _hubContext.Clients.All.SendAsync("OnMenuUpdated", new
        {
            AddedCount = addedProducts.Count,
            Categories = parsedCategories.Select(c => c.CategoryName).Distinct().ToList(),
            ParsedAt = DateTime.UtcNow
        });

        return Ok(new
        {
            success = true,
            message = $"{addedProducts.Count} yeni ürün menüye eklendi.",
            addedProducts = addedProducts.Select(p => new { p.Name, p.Category, p.Price })
        });
    }

    // ── Stub OCR Parser ────────────────────────────────────────────────────────
    private static List<ParsedCategory> StubParseMenu(string fileName)
    {
        // Simulate realistic menu extraction from a café menu PDF
        return new List<ParsedCategory>
        {
            new ParsedCategory
            {
                CategoryName = "Sıcak İçecekler",
                Items = new List<ParsedItem>
                {
                    new ParsedItem { Name = "Türk Kahvesi",    Price = 85m,  Description = "Geleneksel Türk kahvesi, köpüklü ve aromalı." },
                    new ParsedItem { Name = "Sütlü Kahve",     Price = 110m, Description = "Sıcak süt ile yumuşatılmış filtre kahve." },
                    new ParsedItem { Name = "Sahlep",          Price = 95m,  Description = "Kışın vazgeçilmezi, tarçın ve Hindistan cevizi ile." },
                }
            },
            new ParsedCategory
            {
                CategoryName = "Soğuk İçecekler",
                Items = new List<ParsedItem>
                {
                    new ParsedItem { Name = "Buzlu Latte",     Price = 130m, Description = "Soğuk süt üzerine espresso, buz ile servis." },
                    new ParsedItem { Name = "Limonata",        Price = 80m,  Description = "Taze sıkılmış limon, nane ve buz." },
                    new ParsedItem { Name = "Smoothie",        Price = 120m, Description = "Mevsim meyveleri ile hazırlanan taze içecek." },
                }
            },
            new ParsedCategory
            {
                CategoryName = "Yiyecekler",
                Items = new List<ParsedItem>
                {
                    new ParsedItem { Name = "Avokadolu Tost",  Price = 145m, Description = "Tam buğday ekmeğinde avokado, domates ve limon." },
                    new ParsedItem { Name = "Panini",          Price = 135m, Description = "Izgara sandviç, çeşit iç seçenekleriyle." },
                    new ParsedItem { Name = "Waffle",          Price = 150m, Description = "Ev yapımı waffle, meyve ve çırpılmış krema." },
                }
            }
        };
    }

    private class ParsedCategory
    {
        public string CategoryName { get; set; } = string.Empty;
        public List<ParsedItem> Items { get; set; } = new();
    }

    private class ParsedItem
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
