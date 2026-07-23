using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Data;
using QrBillSplit.Backend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Caching.Memory;
using QrBillSplit.Backend.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace QrBillSplit.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly IOtpSender _otpSender;
    private readonly IWebHostEnvironment _env;

    public AuthController(AppDbContext context, IConfiguration config, IMemoryCache cache, IOtpSender otpSender, IWebHostEnvironment env)
    {
        _context = context;
        _config = config;
        _cache = cache;
        _otpSender = otpSender;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("User already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Using simple bcrypt if available, else a stub
            Name = request.Name ?? request.Email.Split('@')[0]
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new { success = true, token, user = new { user.Id, user.Name, user.Email } });
    }

    [HttpPost("login")]
    [EnableRateLimiting("OtpLimit")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        // 3-Strike Lockout Check
        if (_cache.TryGetValue($"otp_lockout_{request.Email}", out _))
            return StatusCode(429, "Too many failed attempts. Please try again in 15 minutes.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        // Generate 6-digit OTP
        var otpCode = new Random().Next(100000, 999999).ToString();
        
        // Store in Cache with 3 minute TTL
        _cache.Set($"otp_{user.Email}", otpCode, TimeSpan.FromMinutes(3));

        // Send OTP via Interface
        await _otpSender.SendOtpAsync(user.Email, otpCode);

        return Ok(new { success = true, requiresOtp = true, email = user.Email });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (_cache.TryGetValue($"otp_lockout_{request.Email}", out _))
            return StatusCode(429, "Too many failed attempts. Please try again in 15 minutes.");

        if (!_cache.TryGetValue($"otp_{request.Email}", out string? cachedOtp))
        {
            // Dev hook: Allow bypassing missing cache if using master code
            if (!(_env.IsDevelopment() && request.Code == "000000"))
                return BadRequest("OTP expired or invalid.");
        }

        bool isMasterCode = _env.IsDevelopment() && request.Code == "000000";

        if (cachedOtp != request.Code && !isMasterCode)
        {
            var attempts = _cache.GetOrCreate($"otp_attempts_{request.Email}", entry => {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                return 0;
            });
            attempts++;
            
            if (attempts >= 3)
            {
                _cache.Set($"otp_lockout_{request.Email}", true, TimeSpan.FromMinutes(15));
                _cache.Remove($"otp_attempts_{request.Email}");
                return StatusCode(429, "Too many failed attempts. Please try again in 15 minutes.");
            }
            else
            {
                _cache.Set($"otp_attempts_{request.Email}", attempts, TimeSpan.FromMinutes(15));
            }
            
            return BadRequest("Invalid OTP code.");
        }

        // Clear cache upon success
        _cache.Remove($"otp_{request.Email}");
        _cache.Remove($"otp_attempts_{request.Email}");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return NotFound("User not found.");

        var token = GenerateJwtToken(user);
        return Ok(new { success = true, token, user = new { user.Id, user.Name, user.Email } });
    }

    private string GenerateJwtToken(User user)
    {
        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"] ?? "super_secret_key_12345678901234567890");
        var tokenHandler = new JwtSecurityTokenHandler();
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(descriptor);
        return tokenHandler.WriteToken(token);
    }
}

public class AuthRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    public string? Name { get; set; }
}

public class VerifyOtpRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be exactly 6 digits.")]
    public string Code { get; set; } = string.Empty;
}
