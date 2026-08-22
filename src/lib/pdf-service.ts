import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getPageWidth(doc: jsPDF): number {
  const ps = doc.internal.pageSize as any;
  return typeof ps.getWidth === 'function' ? ps.getWidth() : (ps.width ?? 210);
}

function getFinalY(doc: jsPDF, fallback = 150): number {
  const d = doc as any;
  return d.lastAutoTable?.finalY ?? d.autoTable?.previous?.finalY ?? fallback;
}

function parsePreds(raw: any): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

export class PDFService {
  static async fetchImageBase64(url: string): Promise<string | null> {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  /**
   * Reporte compacto de pronósticos — una línea por partido.
   * Col 1: "México - Sudáfrica"
   * Cols 2-4: "México x3.45" | "Empate x5.20" | "Sudáfrica x2.10"
   *
   * Los quinielas se acceden por ÍNDICE (0=Form1, 1=Form2, 2=Form3)
   * para evitar fallos por diferencias en el campo nombre.
   */
  static async generateUserPredictions(
    profile: any,
    matches: any[],
    quinielas: any[],
    isCerrado: boolean = false
  ) {
    try {
      const doc = new jsPDF({ compress: true });
      const pageWidth = getPageWidth(doc);

      // ── HEADER ─────────────────────────────────────────────────────────
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('MUNDIAL QUINIELA 5.0', 10, 13);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('REPORTE DE PRONÓSTICOS', pageWidth - 10, 13, { align: 'right' });

      // ── INFO USUARIO ────────────────────────────────────────────────────
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 20, pageWidth, 14, 'F');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(`Usuario: ${profile?.nombre || 'N/A'}`, 10, 27);
      doc.setFont('helvetica', 'normal');
      doc.text(`ID: ${profile?.identificacion || 'N/A'}`, 10, 32);
      doc.text(
        `Fecha: ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`,
        pageWidth - 10, 27, { align: 'right' }
      );
      if (isCerrado) {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text('CERRADA', pageWidth - 10, 32, { align: 'right' });
      }

      // ── Ordenar por número de partido ───────────────────────────────────
      const sortedMatches = [...matches].sort(
        (a, b) => (Number(a.numero_partido) || 0) - (Number(b.numero_partido) || 0)
      );

      // ── Helper: celda de pronóstico por índice de formulario (0,1,2) ────
      // Devuelve: "México x3.45" | "Empate x5.20" | "-"
      const getCell = (m: any, formIndex: number): string => {
        const q = quinielas[formIndex];
        if (!q) return '-';

        const preds = parsePreds(q.predicciones);
        const val: string | undefined = preds[m.id];
        if (!val) return '-';

        const p1 = m.pais1?.nombre || 'Local';
        const p2 = m.pais2?.nombre || 'Visitante';

        let teamName: string;
        let factor: number | null = null;

        if (val === '1') {
          teamName = p1;
          factor = m.factor1 ?? null;
        } else if (val === 'X') {
          teamName = 'Empate';
          factor = m.factor2 ?? null;
        } else {
          teamName = p2;
          factor = m.factor3 ?? null;
        }

        const fStr = factor != null ? ` (${Number(factor).toFixed(2)})` : '';
        return `${teamName}${fStr}`;
      };

      // ── Filas ────────────────────────────────────────────────────────────
      const body = sortedMatches.map((m) => {
        const p1 = m.pais1?.nombre || 'TBD';
        const p2 = m.pais2?.nombre || 'TBD';
        const num = m.numero_partido ?? '';
        return [
          { content: String(num), styles: { halign: 'center' as const } },
          { content: `${p1} - ${p2}` },
          { content: getCell(m, 0) },
          { content: getCell(m, 1) },
          { content: getCell(m, 2) },
        ];
      });

      // ── Tabla ─────────────────────────────────────────────────────────────
      autoTable(doc, {
        startY: 36,
        head: [[
          { content: '#',           styles: { halign: 'center' as const } },
          { content: 'PARTIDO',     styles: { halign: 'left' as const } },
          { content: 'FORMULARIO 1',styles: { halign: 'center' as const } },
          { content: 'FORMULARIO 2',styles: { halign: 'center' as const } },
          { content: 'FORMULARIO 3',styles: { halign: 'center' as const } },
        ]],
        body,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: 2,
          minCellHeight: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
          minCellHeight: 7,
          textColor: [20, 20, 20],
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 9,  halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' },
          4: { cellWidth: 40, halign: 'center' },
        },
      });

      // ── FOOTER ─────────────────────────────────────────────────────────
      const finalY = getFinalY(doc, 200);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, finalY + 5, pageWidth - 10, finalY + 5);
      doc.setFontSize(6.5);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'NOTA: Este documento NO representa participación oficial. Es solo para efectos de verificación individual.',
        pageWidth / 2, finalY + 10, { align: 'center' }
      );

      doc.save(`Pronosticos_Mundial_${(profile?.nombre || 'Usuario').replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Critical PDF error:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  }

  // ── REPORTE DE PARTICIPANTES ────────────────────────────────────────────
  static generatePromoterParticipantReport(quiniela: any, participants: any[]) {
    const doc = new jsPDF();
    const pageWidth = getPageWidth(doc);

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE PARTICIPANTES', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
    doc.text(quiniela.nombre || 'Quiniela Oficial', 10, 26);
    doc.text(`Total: ${participants.length}`, pageWidth - 10, 26, { align: 'right' });
    doc.text(`Fecha: ${format(new Date(), 'PPpp', { locale: es })}`, pageWidth - 10, 32, { align: 'right' });

    autoTable(doc, {
      startY: 36,
      head: [['#', 'Nombre', 'Identificación', 'ID Interno', 'Registro']],
      body: participants.map((p, i) => [
        i + 1,
        p.perfil?.nombre || 'N/A',
        p.perfil?.identificacion || 'N/A',
        p.id_interno_validado || 'N/A',
        format(new Date(p.created_at), 'dd/MM/yyyy'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    doc.save(`Participantes_${quiniela.nombre || 'Quiniela'}.pdf`);
  }

  // ── REPORTE DETALLADO POR PARTICIPANTE ─────────────────────────────────
  static async generatePromoterDetailedReport(
    quiniela: any, participants: any[], matches: any[], allPredictions: any[]
  ) {
    try {
      const doc = new jsPDF();
      const pageWidth = getPageWidth(doc);
      let currentY = 20;

      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(`DETALLE: ${quiniela.nombre}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      const sortedMatches = [...matches].sort(
        (a, b) => (Number(a.numero_partido) || 0) - (Number(b.numero_partido) || 0)
      );

      for (let pIdx = 0; pIdx < participants.length; pIdx++) {
        const p = participants[pIdx];
        if (currentY > 230) { doc.addPage(); currentY = 20; }

        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(
          `${pIdx + 1}. ${p.perfil?.nombre} (${p.perfil?.identificacion || 'S/I'})`,
          15, currentY
        );
        currentY += 5;

        const userPreds = allPredictions.filter((ap) => ap.usuario_id === p.user_id);

        autoTable(doc, {
          startY: currentY,
          head: [['#', 'Partido', 'Form. 1', 'Form. 2', 'Form. 3']],
          body: sortedMatches.map((m) => {
            const getVal = (formNum: number): string => {
              const q = userPreds.find((quin: any) => quin.nombre === `FORMULARIO ${formNum}`);
              if (!q?.predicciones) return '-';
              const preds = parsePreds(q.predicciones);
              const val: string = preds[m.id];
              if (!val) return '-';
              return val === 'X' ? 'Empate' : val === '1' ? (m.pais1?.nombre || '1') : (m.pais2?.nombre || '2');
            };
            return [
              m.numero_partido || '',
              `${m.pais1?.nombre || 'TBD'} - ${m.pais2?.nombre || 'TBD'}`,
              getVal(1), getVal(2), getVal(3),
            ];
          }),
          theme: 'grid',
          headStyles: { fillColor: [51, 65, 85], fontSize: 7, textColor: 255 },
          bodyStyles: { fontSize: 7, minCellHeight: 6 },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
          },
          margin: { left: 15 },
          tableWidth: pageWidth - 30,
          didDrawPage: (data: any) => { currentY = (data.cursor?.y ?? currentY) + 10; },
        });
        currentY = getFinalY(doc, currentY) + 10;
      }
      doc.save(`Detalle_${quiniela.nombre}.pdf`);
    } catch (e) { console.error(e); alert('Error al generar reporte detallado.'); }
  }

  // ── RANKING ─────────────────────────────────────────────────────────────
  static generateRankingReport(quiniela: any, ranking: any[]) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = getPageWidth(doc);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('RANKING OFICIAL', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.text(quiniela.nombre || 'Quiniela Oficial', pageWidth / 2, 26, { align: 'center' });
    autoTable(doc, {
      startY: 34,
      head: [['Pos', 'Participante', 'Puntos', 'Form. 1', 'Form. 2', 'Form. 3', 'Efectividad']],
      body: ranking.map((r, i) => [
        i + 1, r.nombre, r.puntos,
        r.pred_1 || '-', r.pred_2 || '-', r.pred_3 || '-',
        `${r.efectividad}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: 255 },
      bodyStyles: { fontSize: 9 },
    });
    doc.save(`Ranking_${quiniela.nombre || 'Quiniela'}.pdf`);
  }

  // ── RANKING BINGO VAR ───────────────────────────────────────────────────
  static generateBingoRankingReport(match: any, ranking: any[]) {
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageWidth = getPageWidth(doc);
    
    // Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDITORÍA BINGO VAR MUNDIALISTA', 15, 12);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`PARTIDO: ${match.pais1?.nombre} vs ${match.pais2?.nombre}`, 15, 18);
    doc.text(`FECHA: ${match.fecha} | SEDE: ${match.sede?.nombre || 'N/A'}`, 15, 22);

    doc.setTextColor(255, 255, 255);
    doc.text(
      `FECHA REPORTE: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      pageWidth - 15, 18, { align: 'right' }
    );

    // Body
    autoTable(doc, {
      startY: 32,
      head: [['Pos', 'Participante', 'Cédula/ID', 'Puntos', 'Ticket ID', 'Fecha Registro']],
      body: ranking.map((r, i) => [
        i + 1,
        r.user_name || 'N/A',
        r.user_cedula || 'N/A',
        { content: String(r.puntos), styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
        { content: String(r.id).slice(0, 8).toUpperCase(), styles: { fontStyle: 'italic' as const } },
        format(new Date(r.created_at), 'dd/MM HH:mm'),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald 500
        textColor: 255,
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
      },
    });

    const finalY = getFinalY(doc, 250);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      'Este documento es un respaldo oficial de la plataforma FanFest Digital 5.0 para procesos de auditoría y entrega de premios.',
      pageWidth / 2, finalY + 10, { align: 'center' }
    );

    doc.save(`Ranking_Bingo_Match_${match.partido_nro || '00'}.pdf`);
  }
}
