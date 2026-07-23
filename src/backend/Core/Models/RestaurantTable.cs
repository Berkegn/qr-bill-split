using System;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Core.Models;

public class RestaurantTable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TableNumber { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public bool IsOccupied { get; set; } = false;
}
