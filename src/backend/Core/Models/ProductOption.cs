namespace QrBillSplit.Backend.Core.Models;

public class ProductOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public string Label { get; set; } = string.Empty; // e.g. "İçerik"
    public List<string> Choices { get; set; } = new(); // e.g. ["Kaşarlı","Sucuklu","Karışık"]
    public bool IsRequired { get; set; } = false;

    public Product? Product { get; set; }
}
