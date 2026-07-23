using System;
using System.Text.Json.Serialization;

namespace QrBillSplit.Backend.Models;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ReceiptId { get; set; }
    
    [JsonIgnore]
    public Receipt? Receipt { get; set; }
    
    public string ProductName { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public int Quantity { get; set; } = 1;
}
