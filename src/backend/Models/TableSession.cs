namespace QrBillSplit.Backend.Models;

public class TableSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TableName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    
    public ICollection<BillItem> BillItems { get; set; } = new List<BillItem>();
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}
