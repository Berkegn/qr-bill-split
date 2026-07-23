using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrBillSplit.Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTableOccupantsList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OccupantName",
                table: "RestaurantTables");

            migrationBuilder.AddColumn<List<string>>(
                name: "Occupants",
                table: "RestaurantTables",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Occupants",
                table: "RestaurantTables");

            migrationBuilder.AddColumn<string>(
                name: "OccupantName",
                table: "RestaurantTables",
                type: "text",
                nullable: true);
        }
    }
}
