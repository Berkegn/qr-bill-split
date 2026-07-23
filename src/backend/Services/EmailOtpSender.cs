using System;
using System.Threading.Tasks;
using QrBillSplit.Backend.Core.Interfaces;

namespace QrBillSplit.Backend.Services;

public class EmailOtpSender : IOtpSender
{
    public Task SendOtpAsync(string destination, string code)
    {
        // Mocking SMTP implementation. 
        // This simulates connecting to SendGrid or standard SmtpClient.
        Console.WriteLine("\n=========================================");
        Console.WriteLine($"[EMAIL OTP SENDER]");
        Console.WriteLine($"To: {destination}");
        Console.WriteLine($"Subject: Your QrBillSplit Verification Code");
        Console.WriteLine($"Body: Your secure code is: {code}");
        Console.WriteLine($"This code will expire in 3 minutes.");
        Console.WriteLine("=========================================\n");

        return Task.CompletedTask;
    }
}
