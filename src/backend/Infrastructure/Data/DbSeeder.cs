using QrBillSplit.Backend.Core.Models;
using Microsoft.EntityFrameworkCore;
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;


namespace QrBillSplit.Backend.Infrastructure.Data;

public static class DbSeeder
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.Migrate();

        if (!context.Products.Any())
        {
            var products = new List<Product>
            {
                new Product { Name = "Espresso", Price = 120.00m, Category = "Kahveler", Description = "Küçük ama güçlü bir kahve, yoğun ve aromatik." },
                new Product { Name = "Latte", Price = 125.00m, Category = "Kahveler", Description = "Espresso, bol miktarda sıcak süt ve hafif süt köpüğü ile yapılır." },
                new Product { Name = "Siyah Çay", Price = 75.00m, Category = "Çaylar", Description = "Geleneksel demleme siyah çay." },
                new Product { Name = "Chai Tea Latte", Price = 90.00m, Category = "Çaylar", Description = "Baharatlı siyah çay, süt ve tarçın eşliğinde." },
                new Product { Name = "Cheesecake", Price = 180.00m, Category = "Tatlılar", Description = "Krem peynirli pasta, üzerine meyve sosu veya çikolata sosu." },
                new Product { Name = "Tiramisu", Price = 170.00m, Category = "Tatlılar", Description = "Kahve ve mascarpone peyniri ile yapılan klasik İtalyan tatlısı." },
                new Product { Name = "Kruvasan", Price = 80.00m, Category = "Atıştırmalıklar", Description = "Sade, çikolatalı, bademli veya peynirli." },
                new Product { Name = "Tostlar", Price = 125.00m, Category = "Atıştırmalıklar", Description = "Kaşarlı tost, sucuklu tost, üç peynirli tost." }
            };
            context.Products.AddRange(products);
            context.SaveChanges();
        }

        if (!context.TableSessions.Any())
        {
            var tableSession = new TableSession
            {
                Id = "table-5",
                TableName = "Table 5",
                TotalAmount = 45.00m
            };

            var billItems = new List<BillItem>
            {
                new BillItem { Name = "Latte", Price = 5.50m, TableSessionId = tableSession.Id },
                new BillItem { Name = "Cappuccino", Price = 6.00m, TableSessionId = tableSession.Id },
                new BillItem { Name = "Cheesecake", Price = 8.50m, TableSessionId = tableSession.Id },
                new BillItem { Name = "Avocado Toast", Price = 12.00m, TableSessionId = tableSession.Id },
                new BillItem { Name = "Iced Americano", Price = 13.00m, TableSessionId = tableSession.Id }
            };

            context.TableSessions.Add(tableSession);
            context.BillItems.AddRange(billItems);
            context.SaveChanges();
        }

        // Seed Tables
        if (!context.RestaurantTables.Any())
        {
            var tables = new List<RestaurantTable>();
            for (int i = 1; i <= 10; i++)
            {
                tables.Add(new RestaurantTable { TableNumber = $"Masa {i}", SessionId = Guid.NewGuid() });
            }
            context.RestaurantTables.AddRange(tables);
            context.SaveChanges();
        }

        // Seed Receipts
        var existingReceiptsCount = context.Receipts.Count();
        if (existingReceiptsCount <= 350)
        {
            // Wipe existing to prevent duplicates/conflicts and get clean 30 day spread
            context.OrderItems.RemoveRange(context.OrderItems);
            context.Receipts.RemoveRange(context.Receipts);
            context.SaveChanges();

            var tables = context.RestaurantTables.ToList();
            var random = new Random();
            var receipts = new List<Receipt>();
            var orderItems = new List<OrderItem>();
            
            string[] items = { "Cheesecake", "Iced Latte", "Brownie", "Americano", "Filter Coffee", "Siyah Çay", "Kruvasan", "Tostlar" };
            decimal[] prices = { 210m, 120m, 150m, 90m, 70m, 75m, 80m, 125m };
            string[] paymentMethods = { "QR", "Cash", "POS" };
            
            // Seed 350 receipts over the last 30 days
            for (int i = 0; i < 350; i++)
            {
                var table = tables[random.Next(tables.Count)];
                
                // Random day offset from today (0 to 30)
                var dayOffset = random.Next(0, 31);
                
                // Spread across 10:00 AM to 22:00 PM for that day
                var openedAt = DateTime.UtcNow.Date.AddDays(-dayOffset).AddHours(10).AddMinutes(random.Next(0, 12 * 60));
                var closedAt = openedAt.AddMinutes(random.Next(20, 120));
                
                var receipt = new Receipt
                {
                    TableId = table.Id,
                    PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                    IsSplitPayment = random.NextDouble() > 0.35, // ~65% split
                    OpenedAt = openedAt,
                    ClosedAt = closedAt,
                    TotalAmount = 0
                };
                
                int itemCount = random.Next(2, 8);
                for (int j = 0; j < itemCount; j++)
                {
                    int itemIndex = random.Next(items.Length);
                    int qty = random.Next(1, 4);
                    var price = prices[itemIndex];
                    
                    orderItems.Add(new OrderItem
                    {
                        ReceiptId = receipt.Id,
                        ProductName = items[itemIndex],
                        Price = price,
                        Quantity = qty
                    });
                    
                    receipt.TotalAmount += price * qty;
                }
                
                receipts.Add(receipt);
            }
            
            context.Receipts.AddRange(receipts);
            context.OrderItems.AddRange(orderItems);
            context.SaveChanges();
        }
    }
}
