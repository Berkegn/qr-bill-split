using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrBillSplit.Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAmountPaidToBillItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "BillItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "BillItems");
        }
    }
}
