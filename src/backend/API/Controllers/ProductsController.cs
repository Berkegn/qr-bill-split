using Microsoft.AspNetCore.Mvc;
using QrBillSplit.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;
using QrBillSplit.Backend.Core.Models;


namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IAppDbContext _context;

    public ProductsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _context.Products.ToListAsync();
        return Ok(products);
    }

    [HttpPost]
    public async Task<IActionResult> AddProduct([FromBody] Product product)
    {
        if (product.Id == Guid.Empty)
        {
            product.Id = Guid.NewGuid();
        }
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        return Ok(new { success = true, product });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] Product productUpdate)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { success = false, message = "Product not found" });
        }

        product.Name = productUpdate.Name;
        product.Price = productUpdate.Price;
        product.Category = productUpdate.Category;
        product.Description = productUpdate.Description;

        await _context.SaveChangesAsync();
        
        return Ok(new { success = true, product });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { success = false, message = "Product not found" });
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        
        return Ok(new { success = true });
    }
}
