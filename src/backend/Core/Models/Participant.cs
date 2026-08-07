using System.Text.Json.Serialization;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Core.Models;

public class Participant
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string TableSessionId { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    [JsonIgnore]
    public TableSession? TableSession { get; set; }
}
