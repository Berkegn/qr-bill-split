using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrBillSplit.Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTipToReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SplitWays",
                table: "Receipts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TipAmount",
                table: "Receipts",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SplitWays",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "TipAmount",
                table: "Receipts");
        }
    }
}
