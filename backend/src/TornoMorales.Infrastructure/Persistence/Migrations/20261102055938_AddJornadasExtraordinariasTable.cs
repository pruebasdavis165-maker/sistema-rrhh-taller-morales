using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TornoMorales.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJornadasExtraordinariasTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JornadasExtraordinarias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpleadoId = table.Column<int>(type: "integer", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Horas = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TipoJornada = table.Column<int>(type: "integer", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SalarioBaseMensual = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    HorasJornadaDiaria = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ValorHoraOrdinaria = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    FactorPago = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ValorHoraExtra = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JornadasExtraordinarias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JornadasExtraordinarias_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JornadasExtraordinarias_EmpleadoId",
                table: "JornadasExtraordinarias",
                column: "EmpleadoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JornadasExtraordinarias");
        }
    }
}
