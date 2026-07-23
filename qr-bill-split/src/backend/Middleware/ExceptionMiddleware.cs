using Microsoft.AspNetCore.Http;
using QrBillSplit.Backend.Models;
using System.Net;
using System.Text.Json;

namespace QrBillSplit.Backend.Middleware;

/// <summary>
/// Global exception handler middleware to trap custom exceptions and standardize API error responses.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await _next(httpContext);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred.");
            await HandleExceptionAsync(httpContext, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse
        {
            Success = false,
            Message = "An internal server error occurred."
        };

        switch (exception)
        {
            case PaymentFailedException e:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = e.Message;
                break;
            case ResourceNotFoundException e:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = e.Message;
                break;
            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = exception.Message; // Optional: Hide in prod
                break;
        }

        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}
