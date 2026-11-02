using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Interfaces;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Services;

/// <summary>
/// Adaptador de infraestructura para la emisión de colillas de pago en PDF
/// utilizando el motor QuestPDF de alto rendimiento.
/// </summary>
public class GeneradorColillaPdfService : IGeneradorColillaPdfService
{
    private const string ColorPrimario = "#1A56DB";
    private const string ColorSecundario = "#334155";
    private const string ColorGrisFondo = "#F1F5F9";
    private const string ColorVerdeNeto = "#0D9488";

    static GeneradorColillaPdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = true;
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
    }

    public byte[] GenerarColillaPdf(Empleado empleado, DeduccionesDto deducciones, DateTime? fechaEmision = null)
    {
        return GenerarColillaPdf(empleado.NombreCompleto, empleado.Cedula, empleado.Cargo, deducciones, fechaEmision);
    }

    public byte[] GenerarColillaPdf(
        string nombreEmpleado,
        string cedula,
        string cargo,
        DeduccionesDto deducciones,
        DateTime? fechaEmision = null)
    {
        var fecha = fechaEmision ?? DateTime.Now;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36); // 0.5 inch margins
                page.DefaultTextStyle(x => x.FontFamily("Lato").FontSize(10).FontColor(Colors.Grey.Darken3));

                // ── ENCABEZADO ──────────────────────────────────────────────
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(titleCol =>
                        {
                            titleCol.Item().Text("TALLER DE TORNO MORALES LÓPEZ")
                                .FontFamily("Lato")
                                .FontSize(18)
                                .ExtraBold()
                                .FontColor(ColorPrimario);

                            titleCol.Item().Text("Mantenimiento Industrial, Tornería y Soldadura Especializada")
                                .FontSize(9)
                                .FontColor(Colors.Grey.Medium);

                            titleCol.Item().Text("Managua, Nicaragua &bull; RUC: J0310000000001 &bull; Tel: +505 2244-8899")
                                .FontSize(8)
                                .FontColor(Colors.Grey.Medium);
                        });

                        row.ConstantItem(180).Column(voucherCol =>
                        {
                            voucherCol.Item().Background(ColorPrimario).Padding(6).AlignCenter()
                                .Text("COMPROBANTE DE PAGO")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.White);

                            voucherCol.Item().Border(1).BorderColor(ColorPrimario).Padding(6).Column(sub =>
                            {
                                sub.Item().Text($"Fecha Emisión: {fecha:dd/MM/yyyy}").FontSize(8).Bold();
                                sub.Item().Text($"Período: Mensual").FontSize(8);
                                sub.Item().Text($"Moneda: Córdobas (C$)").FontSize(8);
                            });
                        });
                    });

                    col.Item().PaddingTop(12).LineHorizontal(1.5f).LineColor(ColorPrimario);
                });

                // ── CONTENIDO PRINCIPAL ─────────────────────────────────────
                page.Content().PaddingTop(16).Column(col =>
                {
                    // 1. Datos del Colaborador
                    col.Item().Background(ColorGrisFondo).Padding(10).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("Colaborador: ").Bold().FontSize(9);
                                t.Span(nombreEmpleado).FontSize(10);
                            });
                            c.Item().PaddingTop(4).Text(t =>
                            {
                                t.Span("Cargo / Puesto: ").Bold().FontSize(9);
                                t.Span(cargo).FontSize(10);
                            });
                        });

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("Cédula de Identidad: ").Bold().FontSize(9);
                                t.Span(cedula).FontSize(10);
                            });
                            c.Item().PaddingTop(4).Text(t =>
                            {
                                t.Span("Régimen Laboral: ").Bold().FontSize(9);
                                t.Span("Ley No. 185 (Código del Trabajo)").FontSize(9);
                            });
                        });
                    });

                    col.Item().PaddingTop(16);

                    // 2. Tabla Desglose Financiero
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        // Header Tabla
                        table.Header(header =>
                        {
                            header.Cell().Background(ColorSecundario).Padding(6)
                                .Text("CONCEPTO SALARIAL").Bold().FontSize(9).FontColor(Colors.White);
                            header.Cell().Background(ColorSecundario).Padding(6).AlignRight()
                                .Text("INGRESOS (C$)").Bold().FontSize(9).FontColor(Colors.White);
                            header.Cell().Background(ColorSecundario).Padding(6).AlignRight()
                                .Text("RETENCIONES (C$)").Bold().FontSize(9).FontColor(Colors.White);
                            header.Cell().Background(ColorSecundario).Padding(6).AlignRight()
                                .Text("NETO (C$)").Bold().FontSize(9).FontColor(Colors.White);
                        });

                        // Fila 1: Salario Ordinario Bruto
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                            .Text("Salario Base Mensual Ordinario").FontSize(9);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text($"{deducciones.SalarioBruto:N2}").FontSize(9);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);

                        // Fila 2: INSS Laboral (7%)
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                            .Text("Deducción INSS Laboral (7.00%)").FontSize(9);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text($"{deducciones.InssLaboral:N2}").FontSize(9).FontColor(Colors.Red.Medium);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);

                        // Fila 3: Retención IR Progresivo DGI
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                            .Text("Retención IR Salarial (Ley 822)").FontSize(9);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text($"{deducciones.IrMensual:N2}").FontSize(9).FontColor(Colors.Red.Medium);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight()
                            .Text("—").FontSize(9).FontColor(Colors.Grey.Medium);

                        // Fila Resumen Totales
                        table.Cell().Background(Colors.Grey.Lighten4).Padding(6)
                            .Text("TOTALES ACUMULADOS").Bold().FontSize(9);
                        table.Cell().Background(Colors.Grey.Lighten4).Padding(6).AlignRight()
                            .Text($"C$ {deducciones.SalarioBruto:N2}").Bold().FontSize(9);
                        table.Cell().Background(Colors.Grey.Lighten4).Padding(6).AlignRight()
                            .Text($"C$ {deducciones.TotalDeducciones:N2}").Bold().FontSize(9).FontColor(Colors.Red.Darken1);
                        table.Cell().Background(Colors.Grey.Lighten4).Padding(6).AlignRight()
                            .Text($"C$ {deducciones.SalarioNeto:N2}").Bold().FontSize(9).FontColor(ColorVerdeNeto);
                    });

                    col.Item().PaddingTop(18);

                    // 3. Cuadro Destacado de Salario Neto
                    col.Item().Border(1.5f).BorderColor(ColorPrimario).Background(ColorGrisFondo).Padding(10).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("MONTO LÍQUIDO A RECIBIR").Bold().FontSize(10).FontColor(ColorPrimario);
                            c.Item().Text($"Salario Gravable Mensual: C$ {deducciones.SalarioGravableMensual:N2} | Renta Anual Proyectada: C$ {deducciones.RentaNetaAnualProyectada:N2}")
                                .FontSize(8).FontColor(Colors.Grey.Darken1);
                        });

                        row.ConstantItem(180).AlignRight().Text($"C$ {deducciones.SalarioNeto:N2}")
                            .FontSize(16).Bold().FontColor(ColorPrimario);
                    });

                    col.Item().PaddingTop(40);

                    // 4. Firmas de Conformidad
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(1).LineColor(Colors.Grey.Darken1);
                            c.Item().PaddingTop(4).AlignCenter().Text("Firma del Colaborador").Bold().FontSize(9);
                            c.Item().AlignCenter().Text($"Cédula: {cedula}").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().AlignCenter().Text("Recibí conforme a derecho").FontSize(8).Italic();
                        });

                        row.ConstantItem(40);

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(1).LineColor(Colors.Grey.Darken1);
                            c.Item().PaddingTop(4).AlignCenter().Text("Taller de Torno Morales López").Bold().FontSize(9);
                            c.Item().AlignCenter().Text("Administración & Recursos Humanos").FontSize(8).FontColor(Colors.Grey.Medium);
                            c.Item().AlignCenter().Text("Sello y Autorización").FontSize(8).Italic();
                        });
                    });
                });

                // ── PIE DE PÁGINA ───────────────────────────────────────────
                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
                    col.Item().PaddingTop(4).Row(row =>
                    {
                        row.RelativeItem().Text(
                            "Documento oficial emitido por el Sistema Integral de Recursos Humanos conforme al Art. 84 del Código del Trabajo de Nicaragua.")
                            .FontSize(7).FontColor(Colors.Grey.Medium);

                        row.ConstantItem(100).AlignRight().Text(x =>
                        {
                            x.Span("Página ");
                            x.CurrentPageNumber();
                            x.Span(" de ");
                            x.TotalPages();
                        });
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}
