using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TornoMorales.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLiquidacionesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Liquidaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpleadoId = table.Column<int>(type: "integer", nullable: false),
                    ContratoId = table.Column<int>(type: "integer", nullable: false),
                    FechaRescision = table.Column<DateOnly>(type: "date", nullable: false),
                    SalarioMensual = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SalarioDiario = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    AntiguedadAnios = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    MesesIndemnizacionArt45 = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    MontoIndemnizacionArt45 = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DiasVacacionesPendientes = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MontoVacaciones = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DiasAguinaldo = table.Column<int>(type: "integer", nullable: false),
                    MontoAguinaldo = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalLiquidacion = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    UsuarioAuditoria = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaCalculo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Liquidaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Liquidaciones_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Liquidaciones_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Liquidaciones_ContratoId",
                table: "Liquidaciones",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Liquidaciones_EmpleadoId",
                table: "Liquidaciones",
                column: "EmpleadoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Liquidaciones");
        }
    }
}
