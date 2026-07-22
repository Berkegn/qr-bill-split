namespace QrBillSplit.Backend.Services;

public interface IOtpSender
{
    Task SendOtpAsync(string destination, string code);
}
