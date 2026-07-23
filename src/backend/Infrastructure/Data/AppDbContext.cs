using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Core.Models;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TableSession> TableSessions { get; set; }
    public DbSet<BillItem> BillItems { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserFriend> UserFriends { get; set; }
    public DbSet<UserPaymentMethod> UserPaymentMethods { get; set; }
    public DbSet<RestaurantTable> RestaurantTables { get; set; }
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<TableSession>()
            .HasMany(t => t.BillItems)
            .WithOne(b => b.TableSession)
            .HasForeignKey(b => b.TableSessionId);
            
        modelBuilder.Entity<TableSession>()
            .HasMany(t => t.Participants)
            .WithOne(p => p.TableSession)
            .HasForeignKey(p => p.TableSessionId);
            
        modelBuilder.Entity<Receipt>()
            .HasMany(r => r.OrderItems)
            .WithOne(o => o.Receipt)
            .HasForeignKey(o => o.ReceiptId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Receipt>()
            .HasOne(r => r.Table)
            .WithMany()
            .HasForeignKey(r => r.TableId)
            .OnDelete(DeleteBehavior.SetNull); // Or NoAction depending on logic, let's keep it NoAction or default
    }
}
