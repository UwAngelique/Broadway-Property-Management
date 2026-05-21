/**
 * Generates PDFs from docs/PLATFORM_STATUS_AND_ROADMAP.md and docs/BANK_AND_MOMO_API_PARTNER_REQUEST.md
 * Run from repo root: node backend/scripts/generate-platform-docs-pdf.js
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const REPO_ROOT = path.resolve(__dirname, '../..');

const DOCS = [
  {
    md: 'PLATFORM_STATUS_AND_ROADMAP.md',
    pdf: 'PLATFORM_STATUS_AND_ROADMAP.pdf',
    title: 'Platform Status & Roadmap',
    subtitle: 'Built · Gaps · Path to revenue',
  },
  {
    md: 'BANK_AND_MOMO_API_PARTNER_REQUEST.md',
    pdf: 'BANK_AND_MOMO_API_PARTNER_REQUEST.pdf',
    title: 'Bank & MoMo API Partnership Request',
    subtitle: 'For financial institution outreach',
  },
];

const COLORS = {
  primary: '#111827',
  accent: '#1d4ed8',
  muted: '#6b7280',
  border: '#e5e7eb',
  tableHeader: '#f3f4f6',
};

function ensureSpace(doc, needed = 60) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return true;
  }
  return false;
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
  doc.font('Courier').fontSize(8).fillColor('#374151').text(text, x + 8, doc.y + 6, { width: w - 16 });
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

function drawTitlePage(doc, meta) {
  const { width, height } = doc.page;
  const margin = doc.page.margins.left;

  doc.rect(0, 0, width, 8).fill(COLORS.accent);

  doc
    .font('Helvetica-Bold')
    .fontSize(26)
    .fillColor(COLORS.primary)
    .text('Broadway Property Management', margin, height * 0.26, { width: width - margin * 2 });

  doc.font('Helvetica').fontSize(16).fillColor(COLORS.accent).text(meta.title, margin, doc.y + 14);

  doc.fontSize(11).fillColor(COLORS.muted).text(meta.subtitle, margin, doc.y + 10);

  doc
    .fontSize(10)
    .text(`Generated: ${new Date().toISOString().slice(0, 10)}`, margin, height * 0.72);

  doc.addPage();
}

function drawToc(doc, sections) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.primary).text('Table of Contents');
  doc.moveDown(0.8);

  sections.forEach((title, i) => {
    ensureSpace(doc, 24);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.primary).text(`${i + 1}. ${title}`);
    doc.moveDown(0.35);
  });

  doc.addPage();
}

function renderMarkdown(doc, markdown) {
  const lines = markdown.split(/\r?\n/);
  let inCode = false;
  let codeBuffer = [];
  let tableRows = [];

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

    if (line.startsWith('# ')) continue;

    if (line.startsWith('## ')) {
      const title = line.replace(/^##\s+/, '').replace(/^\d+\.\s*/, '');
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
        .text(`${checked ? '[x]' : '[ ]'} ${stripMd(text)}`, { indent: 12 });
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
}

function generateOne(meta) {
  const mdPath = path.join(REPO_ROOT, 'docs', meta.md);
  const outPath = path.join(REPO_ROOT, 'docs', meta.pdf);

  if (!fs.existsSync(mdPath)) {
    console.error('Missing:', mdPath);
    return false;
  }

  const markdown = fs.readFileSync(mdPath, 'utf8');
  const sections = [];
  markdown.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('## ')) {
      sections.push(line.replace(/^##\s+/, '').replace(/^\d+\.\s*/, ''));
    }
  });

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: `Broadway PM — ${meta.title}`,
      Author: 'Broadway Property Management',
    },
  });

  const out = fs.createWriteStream(outPath);
  doc.pipe(out);

  drawTitlePage(doc, meta);
  drawToc(doc, sections);
  renderMarkdown(doc, markdown);

  doc.end();

  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      const stat = fs.statSync(outPath);
      console.log('Wrote', outPath, `(${stat.size} bytes)`);
      resolve(stat.size >= 10240);
    });
    out.on('error', reject);
  });
}

async function main() {
  let ok = true;
  for (const meta of DOCS) {
    const good = await generateOne(meta);
    if (!good) ok = false;
  }
  if (!ok) {
    console.warn('One or more PDFs may be too small — check markdown content.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
