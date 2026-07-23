using System;

namespace QrBillSplit.Backend.Models;

public class RestaurantTable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TableNumber { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public bool IsOccupied { get; set; } = false;
}
