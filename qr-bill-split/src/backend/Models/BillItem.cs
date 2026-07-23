using System.Text.Json.Serialization;

namespace QrBillSplit.Backend.Models;

public class BillItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal AmountPaid { get; set; } = 0m;
    public bool IsPaid { get; set; }
    public string? PaidByUserId { get; set; }
    public string? LockedByUserId { get; set; }
    public DateTime? LockedUntil { get; set; }
    public string TableSessionId { get; set; } = string.Empty;
    
    [JsonIgnore]
    public TableSession? TableSession { get; set; }
}
