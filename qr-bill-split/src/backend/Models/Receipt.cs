using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace QrBillSplit.Backend.Models;

public class Receipt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid TableId { get; set; }
    
    [JsonIgnore]
    public RestaurantTable? Table { get; set; }
    
    public decimal TotalAmount { get; set; }
    
    public string PaymentMethod { get; set; } = string.Empty; // "QR", "Cash", "POS"
    
    public bool IsSplitPayment { get; set; }
    
    public DateTime OpenedAt { get; set; }
    
    public DateTime ClosedAt { get; set; }
    
    public decimal TipAmount { get; set; } = 0m;
    
    public int SplitWays { get; set; } = 1;
    
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
