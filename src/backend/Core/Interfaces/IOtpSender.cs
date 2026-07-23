namespace QrBillSplit.Backend.Core.Interfaces;

public interface IOtpSender
{
    Task SendOtpAsync(string destination, string code);
}
