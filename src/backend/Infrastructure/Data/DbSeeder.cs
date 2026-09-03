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

        // ── Products & Options ─────────────────────────────────────
        if (!context.Products.Any())
        {
            var espresso   = new Product { Name = "Espresso",        Price = 120.00m, Category = "Kahveler",       Description = "Küçük ama güçlü, yoğun ve aromatik." };
            var latte      = new Product { Name = "Latte",           Price = 125.00m, Category = "Kahveler",       Description = "Espresso, bol sıcak süt ve hafif köpük." };
            var filtre     = new Product { Name = "Filtre Kahve",    Price = 90.00m,  Category = "Kahveler",       Description = "Günlük demleme, hafif ve aromatik." };
            var siyahCay   = new Product { Name = "Siyah Çay",       Price = 75.00m,  Category = "Çaylar",         Description = "Geleneksel demleme siyah çay." };
            var chaiLatte  = new Product { Name = "Chai Tea Latte",  Price = 90.00m,  Category = "Çaylar",         Description = "Baharatlı çay, süt ve tarçın." };
            var cheesecake = new Product { Name = "Cheesecake",      Price = 180.00m, Category = "Tatlılar",       Description = "Krem peynirli pasta, meyve sosuyla." };
            var tiramisu   = new Product { Name = "Tiramisu",        Price = 170.00m, Category = "Tatlılar",       Description = "Kahve ve mascarpone peyniriyle klasik İtalyan tatlısı." };
            var brownie    = new Product { Name = "Brownie",         Price = 150.00m, Category = "Tatlılar",       Description = "Çikolatalı ıslak kek, vanilyalı dondurmayla." };
            var kruvasan   = new Product { Name = "Kruvasan",        Price = 80.00m,  Category = "Atıştırmalıklar", Description = "Sade, çikolatalı veya bademli." };
            var tostlar    = new Product { Name = "Tostlar",         Price = 125.00m, Category = "Atıştırmalıklar", Description = "Tazelenmiş ekmekte farklı iç seçenekleriyle." };
            var acaiKase   = new Product { Name = "Acai Kase",       Price = 160.00m, Category = "Atıştırmalıklar", Description = "Acai püresi, granola, muz ve bal ile." };

            context.Products.AddRange(espresso, latte, filtre, siyahCay, chaiLatte, cheesecake, tiramisu, brownie, kruvasan, tostlar, acaiKase);
            context.SaveChanges();

            // Product modifiers (options)
            var tostOptions = new ProductOption
            {
                ProductId = tostlar.Id,
                Label = "İçerik",
                Choices = new List<string> { "Kaşarlı", "Sucuklu", "Karışık (Kaşar + Sucuk)", "Üç Peynirli" },
                IsRequired = true
            };
            var kruvasanOptions = new ProductOption
            {
                ProductId = kruvasan.Id,
                Label = "Çeşit",
                Choices = new List<string> { "Sade", "Çikolatalı", "Bademli", "Peynirli" },
                IsRequired = true
            };
            var latteOptions = new ProductOption
            {
                ProductId = latte.Id,
                Label = "Süt Seçimi",
                Choices = new List<string> { "Tam Yağlı", "Yarım Yağlı", "Yulaf Sütü", "Badem Sütü" },
                IsRequired = false
            };
            var cheesecakeOptions = new ProductOption
            {
                ProductId = cheesecake.Id,
                Label = "Sos",
                Choices = new List<string> { "Çilek", "Böğürtlen", "Çikolata", "Sade" },
                IsRequired = false
            };
            context.ProductOptions.AddRange(tostOptions, kruvasanOptions, latteOptions, cheesecakeOptions);
            context.SaveChanges();
        }

        // ── Sample TableSession (legacy, keep for backward compat) ─
        if (!context.TableSessions.Any())
        {
            var tableSession = new TableSession
            {
                Id = "table-5",
                TableName = "Masa 5",
                TotalAmount = 0m
            };
            context.TableSessions.Add(tableSession);
            context.SaveChanges();
        }

        // ── Stable 10 Tables ────────────────────────────────────────
        var stableTableGuids = new Guid[]
        {
            Guid.Parse("a0000000-0000-0000-0000-000000000001"),
            Guid.Parse("a0000000-0000-0000-0000-000000000002"),
            Guid.Parse("a0000000-0000-0000-0000-000000000003"),
            Guid.Parse("a0000000-0000-0000-0000-000000000004"),
            Guid.Parse("a0000000-0000-0000-0000-000000000005"),
            Guid.Parse("a0000000-0000-0000-0000-000000000006"),
            Guid.Parse("a0000000-0000-0000-0000-000000000007"),
            Guid.Parse("a0000000-0000-0000-0000-000000000008"),
            Guid.Parse("a0000000-0000-0000-0000-000000000009"),
            Guid.Parse("a0000000-0000-0000-0000-000000000010"),
        };

        var existingTables = context.RestaurantTables.ToList();
        var extraTables = existingTables.Where(t => !stableTableGuids.Contains(t.Id)).ToList();
        if (extraTables.Any())
        {
            var extraIds = extraTables.Select(t => t.Id).ToList();
            var orphanReceipts = context.Receipts.Where(r => extraIds.Contains(r.TableId)).ToList();
            var orphanOrderItems = context.OrderItems.Where(oi => orphanReceipts.Select(r => r.Id).Contains(oi.ReceiptId)).ToList();
            context.OrderItems.RemoveRange(orphanOrderItems);
            context.Receipts.RemoveRange(orphanReceipts);
            context.RestaurantTables.RemoveRange(extraTables);
            context.SaveChanges();
        }

        for (int i = 0; i < 10; i++)
        {
            if (!context.RestaurantTables.Any(t => t.Id == stableTableGuids[i]))
            {
                context.RestaurantTables.Add(new RestaurantTable
                {
                    Id = stableTableGuids[i],
                    TableNumber = $"Masa {i + 1}",
                    SessionId = Guid.NewGuid(),
                    IsOccupied = false,
                    Status = 0
                });
            }
        }
        context.SaveChanges();

        // Link legacy session to Masa 5
        var masa5 = context.RestaurantTables.FirstOrDefault(t => t.Id == stableTableGuids[4]);
        if (masa5 != null)
        {
            var oldSession = context.TableSessions.FirstOrDefault(s => s.Id == "table-5");
            if (oldSession != null && oldSession.TableId == null)
            {
                oldSession.TableId = masa5.Id;
                context.SaveChanges();
            }
        }

        // ── Seed Analytics Receipts (350 records / 30 days) ─────────
        var existingReceiptsCount = context.Receipts.Count();
        if (existingReceiptsCount <= 350)
        {
            context.OrderItems.RemoveRange(context.OrderItems);
            context.Receipts.RemoveRange(context.Receipts);
            context.SaveChanges();

            var tables = context.RestaurantTables.ToList();
            var random = new Random(42); // fixed seed for reproducibility
            var receipts = new List<Receipt>();
            var orderItems = new List<OrderItem>();

            string[] itemNames  = { "Cheesecake", "Latte", "Brownie", "Espresso", "Filtre Kahve", "Siyah Çay", "Kruvasan", "Tostlar", "Tiramisu", "Acai Kase" };
            decimal[] itemPrices = { 180m, 125m, 150m, 120m, 90m, 75m, 80m, 125m, 170m, 160m };
            string[] paymentMethods = { "QR", "Nakit", "POS" };

            for (int i = 0; i < 350; i++)
            {
                var table = tables[random.Next(tables.Count)];
                var dayOffset = random.Next(0, 31);
                var openedAt = DateTime.UtcNow.Date.AddDays(-dayOffset)
                    .AddHours(10).AddMinutes(random.Next(0, 12 * 60));
                var closedAt = openedAt.AddMinutes(random.Next(20, 120));

                var receipt = new Receipt
                {
                    TableId = table.Id,
                    PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                    IsSplitPayment = random.NextDouble() > 0.35,
                    OpenedAt = openedAt,
                    ClosedAt = closedAt,
                    TotalAmount = 0
                };

                int itemCount = random.Next(2, 8);
                for (int j = 0; j < itemCount; j++)
                {
                    int idx = random.Next(itemNames.Length);
                    int qty = random.Next(1, 4);
                    var price = itemPrices[idx];

                    orderItems.Add(new OrderItem
                    {
                        ReceiptId = receipt.Id,
                        ProductName = itemNames[idx],
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

        // ── Sample Employees ────────────────────────────────────────
        if (!context.Employees.Any())
        {
            var employees = new List<Employee>
            {
                new Employee { FullName = "Ayşe Kaya",    Role = EmployeeRole.Barista,          Email = "ayse@kafe.local",   Phone = "0532 111 1111", HiredAt = DateTime.UtcNow.AddMonths(-18) },
                new Employee { FullName = "Mehmet Arslan", Role = EmployeeRole.MutfakPersoneli, Email = "mehmet@kafe.local", Phone = "0533 222 2222", HiredAt = DateTime.UtcNow.AddMonths(-12) },
                new Employee { FullName = "Zeynep Çelik",  Role = EmployeeRole.Garson,          Email = "zeynep@kafe.local", Phone = "0534 333 3333", HiredAt = DateTime.UtcNow.AddMonths(-6)  },
                new Employee { FullName = "Can Öztürk",    Role = EmployeeRole.Garson,          Email = "can@kafe.local",    Phone = "0535 444 4444", HiredAt = DateTime.UtcNow.AddMonths(-3)  },
                new Employee { FullName = "Fatma Yıldız",  Role = EmployeeRole.Sef,             Email = "fatma@kafe.local",  Phone = "0536 555 5555", HiredAt = DateTime.UtcNow.AddMonths(-24) },
            };
            context.Employees.AddRange(employees);
            context.SaveChanges();

            // Sample shifts for first employee (Mon-Fri 08:00-16:00)
            var shifts = new List<Shift>();
            var ayse = employees[0];
            var workDays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
            foreach (var day in workDays)
            {
                shifts.Add(new Shift { EmployeeId = ayse.Id, DayOfWeek = day, StartTime = new TimeSpan(8, 0, 0), EndTime = new TimeSpan(16, 0, 0) });
            }
            context.Shifts.AddRange(shifts);
            context.SaveChanges();
        }
    }
}
