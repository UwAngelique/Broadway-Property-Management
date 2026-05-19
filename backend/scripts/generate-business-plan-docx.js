/**
 * Generates Broadway Creation Property Management — business plan (Word).
 * Run from backend: node scripts/generate-business-plan-docx.js
 */
const fs = require('fs');
const path = require('path');
const docx = require('docx');

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} = docx;

function cell(text, opts = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: opts.size ?? 22 })],
      }),
    ],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })],
    spacing: { after: 120 },
    alignment: opts.align,
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

async function main() {
  const outDir = path.join(__dirname, '..', 'docs');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'Broadway-Creation-Business-Plan.docx');

  const pricingRows = [
    new TableRow({
      children: [
        cell('Plan', { width: 18 }),
        cell('Monthly (from)', { width: 18 }),
        cell('Who it is for', { width: 32 }),
        cell('How you earn', { width: 32 }),
      ],
    }),
    new TableRow({
      children: [
        cell('Starter'),
        cell('35,000 RWF'),
        cell('Solo landlords, small portfolios'),
        cell('Recurring SaaS subscription'),
      ],
    }),
    new TableRow({
      children: [
        cell('Professional'),
        cell('95,000 RWF'),
        cell('Owners + accountant, mixed use'),
        cell('Higher ARPU + upsell training'),
      ],
    }),
    new TableRow({
      children: [
        cell('Business'),
        cell('185,000 RWF'),
        cell('PM firms, many buildings'),
        cell('Seat expansion + onboarding fees'),
      ],
    }),
    new TableRow({
      children: [
        cell('Enterprise'),
        cell('Custom (~450k+ RWF)'),
        cell('Large orgs, integrations'),
        cell('MSA, SLA, professional services'),
      ],
    }),
    new TableRow({
      children: [
        cell('Platform Partner'),
        cell('Per client + rev share'),
        cell('You resell to landlords'),
        cell('B2B2B markup on your clients'),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Broadway Creation Property Management',
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Business Plan & Revenue Model (Rwanda)', size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          p('Prepared for: internal strategy & investor / bank discussions. Adjust all figures for your cost base and tax advice.'),
          p('Date note: regenerate this file anytime with: node scripts/generate-business-plan-docx.js', { italics: true }),

          h1('1. Executive summary'),
          p(
            'Broadway is a multi-tenant property operations platform for Rwanda: commercial and residential rentals, land parcels (UPI), contracts, rent collection workflows, EBM/purchase-code tracking, Rwanda-oriented tax obligation registers, and audit trails. You make money primarily through recurring subscriptions, with optional revenue from onboarding, integrations, and platform-partner (B2B2B) fees.',
          ),

          h1('2. Problem & opportunity'),
          bullet('Landlords and property managers juggle spreadsheets, WhatsApp, and paper — weak traceability for documents and payments.'),
          bullet('VAT, immovable property-related charges, and PIT/CIT posture need disciplined records; RRA compliance is event-driven and easy to miss.'),
          bullet('Rwanda’s digital economy expects mobile-first experiences (MTN/Airtel, banks) even when APIs are phased in.'),
          bullet('Larger operators want one dashboard: occupancy, rent, vacancy loss, expenses, and tax prep exports.'),

          h1('3. Solution (product)'),
          bullet('Workspace per landlord (or platform partner managing many landlords).'),
          bullet('Roles: owner, accountant, lawyer, tenant — granular workflows and audit events.'),
          bullet('Assets: buildings and land parcels with UPI and location fields.'),
          bullet('Rent: contract-linked amounts, multi-month quotes, reminders, invoice PDFs (RWF, VAT-inclusive).'),
          bullet('Payments: proof upload, landlord-configured channels; EBM flow with RRA purchase codes.'),
          bullet('Compliance: tax profile + obligation register + PDF for advisors; links to official RRA resources.'),
          bullet('Platform mode: activate/suspend landlord clients, rolled-up analytics — for B2B2B partners.'),

          h1('4. Target customers'),
          bullet('Primary: Rwandan property owners (Kigali and secondary cities) with 5–200 units.'),
          bullet('Secondary: property management firms and asset managers.'),
          bullet('Tertiary: platform partners (real estate networks, banks’ landlord programs) white-labeling or reselling.'),

          h1('5. Business model — how you make money'),
          h2('5.1 Subscription (MRR)'),
          p(
            'Charge per landlord workspace monthly (or annual with discount). This is your core engine. Align tier limits (units, seats) with support cost.',
          ),
          h2('5.2 Implementation & training'),
          p(
            'One-time onboarding (e.g. 150,000–750,000 RWF depending on portfolio size) for data import, chart of accounts mapping, and staff training.',
          ),
          h2('5.3 Usage / overage'),
          p(
            'When a client exceeds plan limits, sell seat packs or migrate to the next tier. Optionally SMS/WhatsApp message packs if you meter notifications.',
          ),
          h2('5.4 Platform partner (B2B2B)'),
          p(
            'Charge the partner a fee per active landlord workspace plus optional revenue share on payment facilitation when you add gateways. The partner marks up to their clients.',
          ),
          h2('5.5 Professional services'),
          p(
            'Custom reports, API integrations (ERP, core banking), and compliance workshops billed time-and-materials or fixed SOW.',
          ),
          h2('5.6 Future: payments & float (careful regulation)'),
          p(
            'Long-term, licensed payment facilitation or partnerships with PSPs can earn transaction fees — requires legal and Bank of Rwanda rules; treat as a phase-2 roadmap item.',
          ),

          h1('6. Suggested retail pricing (RWF / month)'),
          p(
            'These align with the in-app /billing/plans catalog. VAT and withholding may apply to your invoices — seek local accounting advice.',
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: pricingRows,
          }),

          h1('7. Go-to-market'),
          bullet('Start with pilot landlords (your network) — case studies with occupancy and time saved.'),
          bullet('Partner with accounting firms: they bring clients; you offer accountant seats and compliance PDFs.'),
          bullet('Content: short Kinyarwanda/English explainers on UPI, rent receipts, and RRA links (not legal advice).'),
          bullet('Enterprise pipeline: banks and housing funds — long cycle but high contract value.'),

          h1('8. Operating costs (planning buckets)'),
          bullet('Cloud hosting (API + DB + file storage).'),
          bullet('Email/SMS/WhatsApp providers.'),
          bullet('Support and success (especially for Business+).'),
          bullet('Legal, audit, and insurance as you scale.'),
          bullet('Payment processing fees when live.'),

          h1('9. KPIs to track'),
          bullet('MRR, churn, NRR (expansion from tier upgrades).'),
          bullet('CAC vs LTV by channel.'),
          bullet('Time-to-value: days until first rent reminder or first paid invoice on platform.'),
          bullet('Support tickets per 100 units.'),

          h1('10. Risks & mitigation'),
          bullet('Regulatory: position as software + records, not tax advice; link to RRA for authoritative guidance.'),
          bullet('Adoption: invest in onboarding; offer migration from spreadsheets.'),
          bullet('Concentration: diversify beyond one large client; use standard MSAs.'),

          h1('11. Roadmap (high level)'),
          bullet('Phase A: subscriptions + plans at signup + manual payments (current direction).'),
          bullet('Phase B: MoMo/bank orchestration with production APIs; dunning automation.'),
          bullet('Phase C: deeper RRA e-filing integrations where APIs exist; mobile apps in stores.'),

          h1('12. Action checklist for you'),
          bullet('Finalize retail prices with your accountant (VAT, discounts, annual prepay).'),
          bullet('Publish Terms of Service, Privacy Policy, and data retention for Rwanda PDPL.'),
          bullet('Open a business bank account for subscription collections.'),
          bullet('Train one “success” playbook: signup → plan → first property → first tenant → first invoice.'),

          new Paragraph({ spacing: { before: 400 } }),
          p('— End of document —', { align: AlignmentType.CENTER, italics: true }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outFile, buffer);
  // eslint-disable-next-line no-console
  console.log('Wrote', outFile);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
