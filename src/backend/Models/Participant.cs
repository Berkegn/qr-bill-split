using System.Text.Json.Serialization;

namespace QrBillSplit.Backend.Models;

public class Participant
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string TableSessionId { get; set; } = string.Empty;
    
    [JsonIgnore]
    public TableSession? TableSession { get; set; }
}
