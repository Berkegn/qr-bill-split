using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Core.Models;
using System.Threading;
using System.Threading.Tasks;

namespace QrBillSplit.Backend.Core.Interfaces;

public interface IAppDbContext
{
    DbSet<TableSession> TableSessions { get; set; }
    DbSet<BillItem> BillItems { get; set; }
    DbSet<Participant> Participants { get; set; }
    DbSet<User> Users { get; set; }
    DbSet<UserFriend> UserFriends { get; set; }
    DbSet<UserPaymentMethod> UserPaymentMethods { get; set; }
    DbSet<RestaurantTable> RestaurantTables { get; set; }
    DbSet<Receipt> Receipts { get; set; }
    DbSet<OrderItem> OrderItems { get; set; }
    DbSet<Product> Products { get; set; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
