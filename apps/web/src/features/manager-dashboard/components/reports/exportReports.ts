import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { formatCurrency, formatPercentage } from '@altsui/shared';
import type { FundMetrics, DealRollup, DealSummary } from '@altsui/shared';

interface ExportData {
  fundMetrics: FundMetrics | undefined;
  dealRollup: DealRollup | undefined;
  selectedDeals: DealSummary[];
  fundName?: string;
  exportDate: Date;
}

// ============================================================================
// CSV Export
// ============================================================================

export function exportToCSV(data: ExportData): void {
  const { fundMetrics, dealRollup, selectedDeals, fundName, exportDate } = data;
  const lines: string[] = [];

  // Header
  lines.push(`Fund Report - ${fundName || 'Portfolio'}`);
  lines.push(`Generated: ${exportDate.toLocaleDateString()}`);
  lines.push('');

  // Fund Metrics
  if (fundMetrics) {
    lines.push('FUND METRICS');
    lines.push('Metric,Value');
    lines.push(`Assets Under Management,${fundMetrics.aum}`);
    lines.push(`Net Asset Value,${fundMetrics.nav}`);
    lines.push(`Total Commitments,${fundMetrics.totalCommitments}`);
    lines.push(`Capital Deployed,${fundMetrics.capitalDeployed}`);
    lines.push(`Uncommitted Capital,${fundMetrics.uncommittedCapital}`);
    lines.push(`Deal Count,${fundMetrics.dealCount}`);
    lines.push(`Investor Count,${fundMetrics.investorCount}`);
    lines.push(`Active Investors,${fundMetrics.activeInvestorCount}`);
    lines.push('');
  }

  // Deal Rollup
  if (dealRollup) {
    lines.push('DEAL ROLLUP');
    lines.push('Metric,Value');
    lines.push(`Deals Selected,${dealRollup.dealCount}`);
    lines.push(`Total Current Value,${dealRollup.totalCurrentValue}`);
    lines.push(`Total Acquisition Cost,${dealRollup.totalAcquisitionCost}`);
    lines.push(`Total Appreciation,${dealRollup.totalAppreciation}`);
    lines.push(`Appreciation %,${dealRollup.appreciationPercent.toFixed(2)}%`);
    lines.push(`Total NOI,${dealRollup.totalNoi}`);
    lines.push(`Total Units,${dealRollup.totalUnits}`);
    lines.push(`Total Sq Ft,${dealRollup.totalSqFt}`);
    lines.push(`Average Occupancy,${dealRollup.avgOccupancy.toFixed(2)}%`);
    lines.push(`Weighted Cap Rate,${dealRollup.weightedCapRate.toFixed(2)}%`);
    lines.push('');
  }

  // Selected Deals
  if (selectedDeals.length > 0) {
    lines.push('SELECTED DEALS');
    lines.push('Name,Status,Property Type,Current Value,Acquisition Price,Units');
    selectedDeals.forEach((deal) => {
      lines.push(
        `"${deal.name}",${deal.status},${deal.propertyType || 'N/A'},${deal.currentValue || 0},${deal.acquisitionPrice || 0},${deal.unitCount || 0}`
      );
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `fund-report-${formatDateForFilename(exportDate)}.csv`);
}

// ============================================================================
// PDF Export
// ============================================================================

export function exportToPDF(data: ExportData): void {
  const { fundMetrics, dealRollup, selectedDeals, fundName, exportDate } = data;
  const doc = new jsPDF();

  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fund Report - ${fundName || 'Portfolio'}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${exportDate.toLocaleDateString()}`, 20, yPos);
  doc.setTextColor(0);
  yPos += 15;

  // Fund Metrics Section
  if (fundMetrics) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Fund Metrics', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Assets Under Management', formatCurrency(fundMetrics.aum)],
        ['Net Asset Value', formatCurrency(fundMetrics.nav)],
        ['Total Commitments', formatCurrency(fundMetrics.totalCommitments)],
        ['Capital Deployed', formatCurrency(fundMetrics.capitalDeployed)],
        ['Uncommitted Capital', formatCurrency(fundMetrics.uncommittedCapital)],
        ['Deal Count', fundMetrics.dealCount.toString()],
        ['Investor Count', fundMetrics.investorCount.toString()],
        ['Active Investors', fundMetrics.activeInvestorCount.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Deal Rollup Section
  if (dealRollup) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Deal Roll-up', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Deals Selected', dealRollup.dealCount.toString()],
        ['Total Current Value', formatCurrency(dealRollup.totalCurrentValue)],
        ['Total Acquisition Cost', formatCurrency(dealRollup.totalAcquisitionCost)],
        ['Total Appreciation', formatCurrency(dealRollup.totalAppreciation)],
        ['Appreciation %', formatPercentage(dealRollup.appreciationPercent / 100)],
        ['Total NOI', formatCurrency(dealRollup.totalNoi)],
        ['Total Units', dealRollup.totalUnits.toLocaleString()],
        ['Total Sq Ft', dealRollup.totalSqFt.toLocaleString()],
        ['Average Occupancy', formatPercentage(dealRollup.avgOccupancy / 100)],
        ['Weighted Cap Rate', formatPercentage(dealRollup.weightedCapRate / 100)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Selected Deals Section
  if (selectedDeals.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Selected Deals', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Deal Name', 'Status', 'Type', 'Current Value', 'Units']],
      body: selectedDeals.map((deal) => [
        deal.name,
        deal.status,
        deal.propertyType || 'N/A',
        deal.currentValue ? formatCurrency(deal.currentValue) : 'N/A',
        deal.unitCount?.toString() || 'N/A',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
    });
  }

  doc.save(`fund-report-${formatDateForFilename(exportDate)}.pdf`);
}

// ============================================================================
// DOCX Export
// ============================================================================

export async function exportToDocx(data: ExportData): Promise<void> {
  const { fundMetrics, dealRollup, selectedDeals, fundName, exportDate } = data;

  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      text: `Fund Report - ${fundName || 'Portfolio'}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${exportDate.toLocaleDateString()}`,
          color: '666666',
          size: 20,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Fund Metrics
  if (fundMetrics) {
    sections.push(
      new Paragraph({
        text: 'Fund Metrics',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const fundMetricsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow('Metric', 'Value', true),
        createTableRow('Assets Under Management', formatCurrency(fundMetrics.aum)),
        createTableRow('Net Asset Value', formatCurrency(fundMetrics.nav)),
        createTableRow('Total Commitments', formatCurrency(fundMetrics.totalCommitments)),
        createTableRow('Capital Deployed', formatCurrency(fundMetrics.capitalDeployed)),
        createTableRow('Uncommitted Capital', formatCurrency(fundMetrics.uncommittedCapital)),
        createTableRow('Deal Count', fundMetrics.dealCount.toString()),
        createTableRow('Investor Count', fundMetrics.investorCount.toString()),
        createTableRow('Active Investors', fundMetrics.activeInvestorCount.toString()),
      ],
    });
    sections.push(new Paragraph({ children: [] })); // Spacer
    sections.push(fundMetricsTable as unknown as Paragraph);
  }

  // Deal Rollup
  if (dealRollup) {
    sections.push(
      new Paragraph({
        text: 'Deal Roll-up',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const rollupTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow('Metric', 'Value', true),
        createTableRow('Deals Selected', dealRollup.dealCount.toString()),
        createTableRow('Total Current Value', formatCurrency(dealRollup.totalCurrentValue)),
        createTableRow('Total Acquisition Cost', formatCurrency(dealRollup.totalAcquisitionCost)),
        createTableRow('Total Appreciation', formatCurrency(dealRollup.totalAppreciation)),
        createTableRow('Appreciation %', formatPercentage(dealRollup.appreciationPercent / 100)),
        createTableRow('Total NOI', formatCurrency(dealRollup.totalNoi)),
        createTableRow('Total Units', dealRollup.totalUnits.toLocaleString()),
        createTableRow('Total Sq Ft', dealRollup.totalSqFt.toLocaleString()),
        createTableRow('Average Occupancy', formatPercentage(dealRollup.avgOccupancy / 100)),
        createTableRow('Weighted Cap Rate', formatPercentage(dealRollup.weightedCapRate / 100)),
      ],
    });
    sections.push(new Paragraph({ children: [] }));
    sections.push(rollupTable as unknown as Paragraph);
  }

  // Selected Deals
  if (selectedDeals.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Selected Deals',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const dealsRows = [
      createTableRow5('Deal Name', 'Status', 'Type', 'Current Value', 'Units', true),
      ...selectedDeals.map((deal) =>
        createTableRow5(
          deal.name,
          deal.status,
          deal.propertyType || 'N/A',
          deal.currentValue ? formatCurrency(deal.currentValue) : 'N/A',
          deal.unitCount?.toString() || 'N/A'
        )
      ),
    ];

    const dealsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: dealsRows,
    });
    sections.push(new Paragraph({ children: [] }));
    sections.push(dealsTable as unknown as Paragraph);
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `fund-report-${formatDateForFilename(exportDate)}.docx`);
}

function createTableRow(col1: string, col2: string, isHeader = false): TableRow {
  const textOptions = isHeader ? { bold: true } : {};
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: col1, ...textOptions })] })],
        borders: getCellBorders(),
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: col2, ...textOptions })] })],
        borders: getCellBorders(),
      }),
    ],
  });
}

function createTableRow5(
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  col5: string,
  isHeader = false
): TableRow {
  const textOptions = isHeader ? { bold: true, size: 18 } : { size: 18 };
  return new TableRow({
    children: [col1, col2, col3, col4, col5].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, ...textOptions })] })],
          borders: getCellBorders(),
        })
    ),
  });
}

function getCellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };
}

// ============================================================================
// Markdown Export
// ============================================================================

export function exportToMarkdown(data: ExportData): void {
  const { fundMetrics, dealRollup, selectedDeals, fundName, exportDate } = data;
  const lines: string[] = [];

  // Header
  lines.push(`# Fund Report - ${fundName || 'Portfolio'}`);
  lines.push('');
  lines.push(`*Generated: ${exportDate.toLocaleDateString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Fund Metrics
  if (fundMetrics) {
    lines.push('## Fund Metrics');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Assets Under Management | ${formatCurrency(fundMetrics.aum)} |`);
    lines.push(`| Net Asset Value | ${formatCurrency(fundMetrics.nav)} |`);
    lines.push(`| Total Commitments | ${formatCurrency(fundMetrics.totalCommitments)} |`);
    lines.push(`| Capital Deployed | ${formatCurrency(fundMetrics.capitalDeployed)} |`);
    lines.push(`| Uncommitted Capital | ${formatCurrency(fundMetrics.uncommittedCapital)} |`);
    lines.push(`| Deal Count | ${fundMetrics.dealCount} |`);
    lines.push(`| Investor Count | ${fundMetrics.investorCount} |`);
    lines.push(`| Active Investors | ${fundMetrics.activeInvestorCount} |`);
    lines.push('');
  }

  // Deal Rollup
  if (dealRollup) {
    lines.push('## Deal Roll-up');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Deals Selected | ${dealRollup.dealCount} |`);
    lines.push(`| Total Current Value | ${formatCurrency(dealRollup.totalCurrentValue)} |`);
    lines.push(`| Total Acquisition Cost | ${formatCurrency(dealRollup.totalAcquisitionCost)} |`);
    lines.push(`| Total Appreciation | ${formatCurrency(dealRollup.totalAppreciation)} |`);
    lines.push(`| Appreciation % | ${formatPercentage(dealRollup.appreciationPercent / 100)} |`);
    lines.push(`| Total NOI | ${formatCurrency(dealRollup.totalNoi)} |`);
    lines.push(`| Total Units | ${dealRollup.totalUnits.toLocaleString()} |`);
    lines.push(`| Total Sq Ft | ${dealRollup.totalSqFt.toLocaleString()} |`);
    lines.push(`| Average Occupancy | ${formatPercentage(dealRollup.avgOccupancy / 100)} |`);
    lines.push(`| Weighted Cap Rate | ${formatPercentage(dealRollup.weightedCapRate / 100)} |`);
    lines.push('');
  }

  // Selected Deals
  if (selectedDeals.length > 0) {
    lines.push('## Selected Deals');
    lines.push('');
    lines.push('| Deal Name | Status | Type | Current Value | Units |');
    lines.push('|-----------|--------|------|---------------|-------|');
    selectedDeals.forEach((deal) => {
      lines.push(
        `| ${deal.name} | ${deal.status} | ${deal.propertyType || 'N/A'} | ${deal.currentValue ? formatCurrency(deal.currentValue) : 'N/A'} | ${deal.unitCount || 'N/A'} |`
      );
    });
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `fund-report-${formatDateForFilename(exportDate)}.md`);
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}

export type ExportFormat = 'csv' | 'pdf' | 'docx' | 'markdown';

export async function exportReport(format: ExportFormat, data: ExportData): Promise<void> {
  switch (format) {
    case 'csv':
      return exportToCSV(data);
    case 'pdf':
      return exportToPDF(data);
    case 'docx':
      return exportToDocx(data);
    case 'markdown':
      return exportToMarkdown(data);
  }
}

