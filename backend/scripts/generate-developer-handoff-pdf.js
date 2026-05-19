/**
 * Generates docs/DEVELOPER_HANDOFF.pdf from docs/DEVELOPER_HANDOFF.md
 * Run from repo root: node backend/scripts/generate-developer-handoff-pdf.js
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const REPO_ROOT = path.resolve(__dirname, '../..');
const MD_PATH = path.join(REPO_ROOT, 'docs', 'DEVELOPER_HANDOFF.md');
const OUT_PATH = path.join(REPO_ROOT, 'docs', 'DEVELOPER_HANDOFF.pdf');

const COLORS = {
  primary: '#111827',
  accent: '#1d4ed8',
  muted: '#6b7280',
  border: '#e5e7eb',
  tableHeader: '#f3f4f6',
};

const DEMO_ACCOUNTS = [
  ['Platform operator', 'platform@broadway.demo', 'Demo2026!'],
  ['Landlord owner', 'owner@demo-landlord.rw', 'Demo2026!'],
  ['Tenant', 'tenant@demo-landlord.rw', 'Demo2026!'],
];

function ensureSpace(doc, needed = 60) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return true;
  }
  return false;
}

function drawTitlePage(doc) {
  const { width, height } = doc.page;
  const margin = doc.page.margins.left;

  doc.rect(0, 0, width, 8).fill(COLORS.accent);

  doc
    .font('Helvetica-Bold')
    .fontSize(32)
    .fillColor(COLORS.primary)
    .text('Broadway Property Management', margin, height * 0.28, { width: width - margin * 2 });

  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor(COLORS.muted)
    .text('Developer Handoff', margin, doc.y + 12);

  doc
    .fontSize(11)
    .text('Rwanda-focused property management SaaS', margin, doc.y + 28)
    .text('NestJS 11 · PostgreSQL · Next.js 16 · React 19 · Tailwind 4', margin, doc.y + 8);

  doc
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(`Generated: ${new Date().toISOString().slice(0, 10)}`, margin, height * 0.72);

  doc.addPage();
}

function drawToc(doc, sections) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.primary).text('Table of Contents', { underline: false });
  doc.moveDown(0.8);

  sections.forEach((title, i) => {
    ensureSpace(doc, 24);
    const num = i + 1;
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLORS.primary)
      .text(`${num}. ${title}`, { continued: false });
    doc.moveDown(0.35);
  });

  doc.addPage();
}

function drawDemoTable(doc) {
  ensureSpace(doc, 120);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.primary).text('Demo accounts (staging / local seed)');
  doc.moveDown(0.5);

  const startX = doc.page.margins.left;
  const colWidths = [130, 200, 90];
  const rowHeight = 22;
  let y = doc.y;

  const headers = ['Role', 'Email', 'Password'];
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(COLORS.tableHeader);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9);
  let x = startX + 6;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 6, { width: colWidths[i] - 8, lineBreak: false });
    x += colWidths[i];
  });
  y += rowHeight;

  doc.font('Helvetica').fontSize(9);
  DEMO_ACCOUNTS.forEach((row, ri) => {
    if (ri % 2 === 1) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#fafafa');
    }
    doc.fillColor(COLORS.primary);
    x = startX + 6;
    row.forEach((cell, i) => {
      doc.text(cell, x, y + 6, { width: colWidths[i] - 8, lineBreak: false });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .text('Change passwords on any public staging URL. Seed: node backend/scripts/seed-demo-staging.js', startX, y + 8);
  doc.y = y + 28;
  doc.moveDown(0.5);
}

function renderMarkdown(doc, markdown) {
  const lines = markdown.split(/\r?\n/);
  let inCode = false;
  let codeBuffer = [];
  let tableRows = [];
  const tocSections = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeBuffer = [];
      } else {
        inCode = false;
        flushCode(doc, codeBuffer);
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('|') && line.includes('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (/^[-:]+$/.test(cells.join(''))) continue;
      tableRows.push(cells);
      continue;
    }

    if (tableRows.length) {
      flushTable(doc, tableRows);
      tableRows = [];
    }

    if (line.startsWith('# ')) {
      continue;
    }

    if (line.startsWith('## ')) {
      const title = line.replace(/^##\s+/, '').replace(/^\d+\.\s*/, '');
      if (!tocSections.includes(title)) tocSections.push(title);
      ensureSpace(doc, 50);
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.accent).text(title);
      doc.moveDown(0.3);
      continue;
    }

    if (line.startsWith('### ')) {
      ensureSpace(doc, 36);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.primary).text(line.replace(/^###\s+/, ''));
      doc.moveDown(0.2);
      continue;
    }

    if (line.startsWith('- [x]') || line.startsWith('- [ ]')) {
      const checked = line.startsWith('- [x]');
      const text = line.replace(/^- \[[x ]\]\s*/, '');
      ensureSpace(doc, 18);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.primary)
        .text(`${checked ? '☑' : '☐'} ${stripMd(text)}`, { indent: 12 });
      continue;
    }

    if (line.startsWith('- ')) {
      ensureSpace(doc, 18);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.primary).text(`• ${stripMd(line.slice(2))}`, { indent: 12 });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      ensureSpace(doc, 18);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.primary).text(stripMd(line), { indent: 12 });
      continue;
    }

    if (line.trim() === '---') {
      ensureSpace(doc, 20);
      doc.moveDown(0.3);
      const x1 = doc.page.margins.left;
      const x2 = doc.page.width - doc.page.margins.right;
      doc.moveTo(x1, doc.y).lineTo(x2, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
      doc.moveDown(0.5);
      continue;
    }

    if (line.trim() === '') {
      doc.moveDown(0.25);
      continue;
    }

    ensureSpace(doc, 20);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.primary).text(stripMd(line), {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'left',
    });
  }

  if (tableRows.length) flushTable(doc, tableRows);
  return tocSections;
}

function stripMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function flushCode(doc, lines) {
  ensureSpace(doc, 40 + lines.length * 12);
  const text = lines.join('\n');
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const h = Math.max(24, lines.length * 11 + 12);
  doc.rect(x, doc.y, w, h).fill('#f9fafb');
  doc
    .font('Courier')
    .fontSize(8)
    .fillColor('#374151')
    .text(text, x + 8, doc.y + 6, { width: w - 16 });
  doc.y += h + 6;
}

function flushTable(doc, rows) {
  if (!rows.length) return;
  const colCount = Math.max(...rows.map((r) => r.length));
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = tableWidth / colCount;
  const rowHeight = 20;
  let y = doc.y;
  ensureSpace(doc, rowHeight * rows.length + 10);

  rows.forEach((row, ri) => {
    if (ri === 0) {
      doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill(COLORS.tableHeader);
      doc.font('Helvetica-Bold').fontSize(8);
    } else {
      if (ri % 2 === 0) {
        doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#fafafa');
      }
      doc.font('Helvetica').fontSize(8);
    }
    doc.fillColor(COLORS.primary);
    let x = doc.page.margins.left + 4;
    for (let i = 0; i < colCount; i++) {
      doc.text(row[i] ?? '', x, y + 6, { width: colWidth - 8, lineBreak: false });
      x += colWidth;
    }
    y += rowHeight;
  });
  doc.y = y + 8;
}

function main() {
  if (!fs.existsSync(MD_PATH)) {
    console.error('Missing markdown:', MD_PATH);
    process.exit(1);
  }

  const markdown = fs.readFileSync(MD_PATH, 'utf8');
  const sections = [];
  markdown.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('## ')) {
      const title = line.replace(/^##\s+/, '').replace(/^\d+\.\s*/, '');
      sections.push(title);
    }
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: 'Broadway PM — Developer Handoff',
      Author: 'Broadway Property Management',
      Subject: 'Developer handoff documentation',
    },
  });

  const out = fs.createWriteStream(OUT_PATH);
  doc.pipe(out);

  drawTitlePage(doc);
  drawToc(doc, sections);
  drawDemoTable(doc);
  renderMarkdown(doc, markdown);

  doc.end();

  out.on('finish', () => {
    const stat = fs.statSync(OUT_PATH);
    console.log('Wrote', OUT_PATH);
    console.log('Size:', stat.size, 'bytes');
    if (stat.size < 10240) {
      console.warn('Warning: PDF is smaller than 10KB — check content rendering.');
      process.exit(1);
    }
  });

  out.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
