using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrBillSplit.Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_SessionEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "TableSessions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "TableSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "TableId",
                table: "TableSessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "JoinedAt",
                table: "Participants",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "TableSessions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "TableSessions");

            migrationBuilder.DropColumn(
                name: "TableId",
                table: "TableSessions");

            migrationBuilder.DropColumn(
                name: "JoinedAt",
                table: "Participants");
        }
    }
}
