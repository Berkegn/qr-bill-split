namespace QrBillSplit.Backend.Core.Models;

public class Employee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public EmployeeRole Role { get; set; } = EmployeeRole.Garson;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime HiredAt { get; set; } = DateTime.UtcNow;

    public List<Shift> Shifts { get; set; } = new();
}
