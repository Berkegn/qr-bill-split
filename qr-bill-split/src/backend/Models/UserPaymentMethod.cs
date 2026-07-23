namespace QrBillSplit.Backend.Models;

public class UserPaymentMethod
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string CardToken { get; set; } = string.Empty;
    public string CardLastFour { get; set; } = string.Empty;
    public string CardBrand { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
