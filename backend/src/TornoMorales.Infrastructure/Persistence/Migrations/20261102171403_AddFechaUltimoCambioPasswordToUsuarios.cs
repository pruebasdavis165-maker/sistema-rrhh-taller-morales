using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornoMorales.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaUltimoCambioPasswordToUsuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimoCambioPassword",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaUltimoCambioPassword",
                table: "Usuarios");
        }
    }
}
