namespace QrBillSplit.Backend.Core.Exceptions;

/// <summary>
/// Thrown when a payment or checkout process fails unexpectedly.
/// </summary>
public class PaymentFailedException : Exception
{
    public PaymentFailedException(string message) : base(message) { }
}

/// <summary>
/// Thrown when a requested resource (like TableSession or BillItem) is not found.
/// </summary>
public class ResourceNotFoundException : Exception
{
    public ResourceNotFoundException(string message) : base(message) { }
}

/// <summary>
/// Represents a standardized API error response.
/// </summary>
public class ApiErrorResponse
{
    public bool Success { get; set; } = false;
    public string Message { get; set; } = string.Empty;
}
