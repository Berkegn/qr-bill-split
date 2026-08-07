namespace QrBillSplit.Backend.Core.Models;

public class TableSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TableName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    
    public Guid? TableId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BillItem> BillItems { get; set; } = new List<BillItem>();
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
