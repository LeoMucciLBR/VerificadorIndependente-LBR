import { NextRequest, NextResponse } from "next/server";
import prisma, { safeQueryRaw } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // ── 1. Buscar execução ───────────────────────────────────────────
    const rawExecution = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        i.id,
        i.uuid,
        i.rodovia_id,
        i.usuario_id,
        NULLIF(i.periodoReferencia, '0000-00-00') as periodoReferencia,
        NULLIF(i.dataInicioVistoria, '0000-00-00 00:00:00') as dataInicioVistoria,
        NULLIF(i.dataFimVistoria, '0000-00-00 00:00:00') as dataFimVistoria,
        i.descricaoVistoria,
        i.is_official,
        i.status,
        i.nota,
        f.nome as fase_nome,
        r.nome as rodovia_nome,
        r.codigo as rodovia_codigo,
        r.extensao as rodovia_extensao,
        u.name as user_name,
        u.email as user_email
      FROM inspecoes i
      LEFT JOIN fases f ON i.fase_id = f.id
      LEFT JOIN rodovias r ON i.rodovia_id = r.id
      LEFT JOIN users u ON i.usuario_id = u.id
      WHERE i.id = ${BigInt(id)}
    `);

    if (!rawExecution || rawExecution.length === 0) {
      return NextResponse.json(
        { error: "Execução não encontrada" },
        { status: 404 }
      );
    }

    const exec = rawExecution[0];

    // Buscar projeto
    let projectName = "—";
    if (exec.rodovia_id) {
      const pr = await prisma.project_rodovias.findFirst({
        where: { rodovia_id: BigInt(exec.rodovia_id) },
        include: { projects: { select: { nome: true } } },
      });
      if (pr?.projects) projectName = pr.projects.nome;
    }

    // ── 2. Buscar ocorrências ────────────────────────────────────────
    const rawOcorrencias = await safeQueryRaw<any[]>(Prisma.sql`
      SELECT 
        o.id,
        NULLIF(o.dataHoraOcorrencia, '0000-00-00 00:00:00') as dataHoraOcorrencia,
        o.anotacoes,
        o.registroReferenteA,
        o.status,
        o.lado,
        o.pistaFaixa,
        o.valor_medido,
        o.unidade_medida,
        o.dentro_do_limite,
        ind.sigla  as indicador_sigla,
        ind.nome   as indicador_nome,
        g.sigla    as grupo_sigla,
        g.nome     as grupo_nome
      FROM ocorrencias o
      LEFT JOIN indicadores ind ON o.indicador_id = ind.id
      LEFT JOIN grupos g ON o.grupo_id = g.id
      WHERE o.inspecao_id = ${BigInt(id)}
      ORDER BY o.dataHoraOcorrencia ASC
    `);

    // Buscar trechos de cada ocorrência
    const ocorrenciaIds = rawOcorrencias.map((o) => BigInt(o.id));
    let trechosMap = new Map<string, any[]>();

    if (ocorrenciaIds.length > 0) {
      try {
        const trechos = await prisma.ocorrenciaTrecho.findMany({
          where: { ocorrencia_id: { in: ocorrenciaIds } },
          include: {
            segmentos_homogeneos: {
              select: { nome: true, kmInicial: true, kmFinal: true },
            },
          },
          orderBy: { ordem: "asc" },
        });

        trechos.forEach((t) => {
          const key = t.ocorrencia_id.toString();
          if (!trechosMap.has(key)) trechosMap.set(key, []);
          trechosMap.get(key)!.push(t);
        });
      } catch (e) {
        console.warn("Erro ao buscar trechos:", e);
      }
    }

    // ── 3. Gerar PDF ─────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Cores
    const primaryColor: [number, number, number] = [37, 99, 235]; // blue-600
    const darkText: [number, number, number] = [15, 23, 42]; // slate-900
    const mutedText: [number, number, number] = [100, 116, 139]; // slate-500
    const lightBg: [number, number, number] = [241, 245, 249]; // slate-100

    // ── Cabeçalho ──
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("RELATÓRIO DE OCORRÊNCIAS", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      margin,
      21
    );

    // Logo / ID no canto direito
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Execução #${String(id).padStart(4, "0")}`, pageWidth - margin, 13, { align: "right" });

    // ── Resumo da Execução ──
    let y = 36;

    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 3, 3, "F");

    const infoCol1X = margin + 6;
    const infoCol2X = margin + 90;
    const infoCol3X = margin + 180;

    const drawInfoField = (x: number, yPos: number, label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...mutedText);
      doc.text(label.toUpperCase(), x, yPos);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.text(value || "—", x, yPos + 5);
    };

    const formatDate = (d: any) => {
      if (!d) return "—";
      try {
        return new Date(d).toLocaleDateString("pt-BR");
      } catch {
        return "—";
      }
    };

    const formatPeriodo = (d: any) => {
      if (!d) return "—";
      try {
        return new Date(d).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      } catch {
        return "—";
      }
    };

    // Row 1
    drawInfoField(infoCol1X, y + 6, "Rodovia", exec.rodovia_nome || "—");
    drawInfoField(infoCol2X, y + 6, "Projeto", projectName);
    drawInfoField(infoCol3X, y + 6, "Fase", exec.fase_nome || "—");

    // Row 2
    drawInfoField(infoCol1X, y + 20, "Período de Referência", formatPeriodo(exec.periodoReferencia));
    drawInfoField(
      infoCol2X,
      y + 20,
      "Vistoria",
      `${formatDate(exec.dataInicioVistoria)} a ${formatDate(exec.dataFimVistoria)}`
    );
    drawInfoField(infoCol3X, y + 20, "Status / Nota", `${exec.status || "—"} | Nota: ${exec.nota ?? "—"}`);

    y += 40;

    // Responsável
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(`Responsável: ${exec.user_name || "—"} (${exec.user_email || "—"})`, margin, y);
    y += 4;

    // Descrição da vistoria
    if (exec.descricaoVistoria) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      const descLines = doc.splitTextToSize(
        `Descrição: ${exec.descricaoVistoria}`,
        pageWidth - margin * 2
      );
      doc.text(descLines, margin, y);
      y += descLines.length * 4 + 2;
    }

    y += 4;

    // ── Resumo Estatístico ──
    const statusCounts: Record<string, number> = {};
    const indicadorCounts: Record<string, number> = {};
    rawOcorrencias.forEach((o) => {
      const s = o.status || "DESCONHECIDO";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      if (o.indicador_sigla) {
        indicadorCounts[o.indicador_sigla] = (indicadorCounts[o.indicador_sigla] || 0) + 1;
      }
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.text("Resumo", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text(`Total de Ocorrências: ${rawOcorrencias.length}`, margin, y);
    y += 5;

    // Status counts
    const statusSummary = Object.entries(statusCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join("  |  ");
    doc.text(`Por Status: ${statusSummary}`, margin, y);
    y += 5;

    // Indicador counts (top 5)
    const topIndicadores = Object.entries(indicadorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    if (topIndicadores.length > 0) {
      const indSummary = topIndicadores.map(([k, v]) => `${k}: ${v}`).join("  |  ");
      doc.text(`Por Indicador: ${indSummary}`, margin, y);
      y += 5;
    }

    y += 4;

    // ── Tabela de Ocorrências ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.text("Listagem de Ocorrências", margin, y);
    y += 2;

    const tableData = rawOcorrencias.map((o, idx) => {
      const trechos = trechosMap.get(o.id.toString()) || [];
      const trechoStr =
        trechos.length > 0
          ? trechos
              .map((t: any) => {
                const seg = t.segmentos_homogeneos?.nome || "—";
                const km = `KM ${t.kmInicial}${t.kmFinal ? ` – ${t.kmFinal}` : ""}`;
                return `${seg} (${km})`;
              })
              .join("; ")
          : "—";

      const dataHora = o.dataHoraOcorrencia
        ? new Date(o.dataHoraOcorrencia).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      const valorMedido =
        o.valor_medido != null
          ? `${o.valor_medido}${o.unidade_medida ? " " + o.unidade_medida : ""}`
          : "—";

      const limite =
        o.dentro_do_limite === true
          ? "Sim"
          : o.dentro_do_limite === false
            ? "Não"
            : "—";

      return [
        String(idx + 1),
        dataHora,
        o.indicador_sigla || "—",
        o.grupo_sigla || "—",
        trechoStr,
        o.lado || "—",
        o.pistaFaixa || "—",
        valorMedido,
        limite,
        o.status || "—",
        (o.anotacoes || "—").substring(0, 80) + (o.anotacoes && o.anotacoes.length > 80 ? "..." : ""),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [
        [
          "#",
          "Data/Hora",
          "Indicador",
          "Grupo",
          "Trecho / KM",
          "Lado",
          "Pista",
          "Valor",
          "Limite",
          "Status",
          "Anotações",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        textColor: darkText,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 24 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 40 },
        5: { cellWidth: 16 },
        6: { cellWidth: 14 },
        7: { cellWidth: 18 },
        8: { halign: "center", cellWidth: 14 },
        9: { halign: "center", cellWidth: 18 },
        10: { cellWidth: "auto" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data: any) => {
        // Footer em cada página
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(...mutedText);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: "center" }
        );
        doc.text(
          "Via Brasil — Sistema de Inspeção Acreditada",
          margin,
          pageHeight - 6
        );
      },
    });

    // ── 4. Retornar PDF ──────────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    const rodoviaSlug = (exec.rodovia_nome || "relatorio")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+$/g, "");
    const filename = `relatorio-ocorrencias-${rodoviaSlug}-exec-${id}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório PDF" },
      { status: 500 }
    );
  }
}
