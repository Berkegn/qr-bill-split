using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrBillSplit.Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTableStatusAndOccupantName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OccupantName",
                table: "RestaurantTables",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "RestaurantTables",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OccupantName",
                table: "RestaurantTables");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RestaurantTables");
        }
    }
}
