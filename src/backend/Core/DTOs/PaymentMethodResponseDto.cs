namespace QrBillSplit.Backend.Core.DTOs;

public class PaymentMethodResponseDto
{
    public int Id { get; set; }
    public string CardLastFour { get; set; } = string.Empty;
    public string CardBrand { get; set; } = string.Empty;
}
