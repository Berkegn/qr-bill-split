using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.Models;

namespace QrBillSplit.Backend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IAppDbContext _context;

    public EmployeesController(IAppDbContext context)
    {
        _context = context;
    }

    // GET /api/employees
    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        var employees = await _context.Employees
            .Include(e => e.Shifts)
            .OrderBy(e => e.FullName)
            .Select(e => new
            {
                e.Id,
                e.FullName,
                e.Email,
                e.Phone,
                e.HiredAt,
                Role = e.Role.ToString(),
                RoleId = (int)e.Role,
                Shifts = e.Shifts.Select(s => new
                {
                    s.Id,
                    DayOfWeek = s.DayOfWeek.ToString(),
                    DayIndex = (int)s.DayOfWeek,
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm")
                }).ToList()
            })
            .ToListAsync();

        return Ok(new { success = true, employees });
    }

    // POST /api/employees
    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
    {
        var employee = new Employee
        {
            FullName = request.FullName,
            Role = (EmployeeRole)request.RoleId,
            Email = request.Email,
            Phone = request.Phone,
            HiredAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, employee = new { employee.Id, employee.FullName, Role = employee.Role.ToString(), employee.Email, employee.Phone } });
    }

    // DELETE /api/employees/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return NotFound(new { success = false, message = "Personel bulunamadı." });

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // POST /api/employees/{id}/shifts
    [HttpPost("{id}/shifts")]
    public async Task<IActionResult> UpsertShift(Guid id, [FromBody] UpsertShiftRequest request)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return NotFound(new { success = false, message = "Personel bulunamadı." });

        // Remove existing shift for the same day if present
        var existing = await _context.Shifts
            .FirstOrDefaultAsync(s => s.EmployeeId == id && s.DayOfWeek == (DayOfWeek)request.DayIndex);
        if (existing != null)
            _context.Shifts.Remove(existing);

        if (!string.IsNullOrEmpty(request.StartTime))
        {
            var shift = new Shift
            {
                EmployeeId = id,
                DayOfWeek = (DayOfWeek)request.DayIndex,
                StartTime = TimeSpan.Parse(request.StartTime),
                EndTime = TimeSpan.Parse(request.EndTime)
            };
            _context.Shifts.Add(shift);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public class CreateEmployeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class UpsertShiftRequest
{
    public int DayIndex { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
