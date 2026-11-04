using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornoMorales.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidatoCvDocumento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DocumentoBase64",
                table: "Candidatos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentoNombre",
                table: "Candidatos",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentoTipo",
                table: "Candidatos",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocumentoBase64",
                table: "Candidatos");

            migrationBuilder.DropColumn(
                name: "DocumentoNombre",
                table: "Candidatos");

            migrationBuilder.DropColumn(
                name: "DocumentoTipo",
                table: "Candidatos");
        }
    }
}
