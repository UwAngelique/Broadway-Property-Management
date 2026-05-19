import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument = require('pdfkit');
import { RwandaTaxProfile } from './rwanda-tax-profile.entity';
import { TaxObligation } from './tax-obligation.entity';
import { UpdateRwandaTaxProfileDto } from './dto/update-rwanda-tax-profile.dto';
import { CreateTaxObligationDto } from './dto/create-tax-obligation.dto';
import { UpdateTaxObligationDto } from './dto/update-tax-obligation.dto';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(RwandaTaxProfile)
    private readonly profileRepo: Repository<RwandaTaxProfile>,
    @InjectRepository(TaxObligation)
    private readonly obligationRepo: Repository<TaxObligation>,
  ) {}

  rraResources() {
    return {
      authorityName: 'Rwanda Revenue Authority (RRA)',
      disclaimer:
        'Figures here are operational trackers only. Rates, filing deadlines, and assessments are determined by RRA and law — verify on official RRA channels.',
      links: [
        { label: 'RRA taxes & fees overview', url: 'https://www.rra.gov.rw/en/taxes-fees' },
        { label: 'Local government / property-related taxes', url: 'https://www.rra.gov.rw/en/domestic-tax-services/local-government-taxes/default-title' },
        { label: 'Income tax (PIT / CIT) hub', url: 'https://www.rra.gov.rw/en/taxes-fees/domestic-taxes/income-tax/register-for-income-tax' },
        { label: 'Personal Income Tax (PIT)', url: 'https://www.rra.gov.rw/en/taxes-fees/domestic-taxes/income-tax/personal-income-tax-pit-1' },
        { label: 'Brochures & guides', url: 'https://www.rra.gov.rw/en/useful-links/brochures' },
      ],
      upiNote:
        'Land and buildings are commonly identified with a Unique Parcel Identifier (UPI) in Rwanda. Store UPI on each property record for traceability with notaries, districts, and tax workflows.',
    };
  }

  async getOrCreateProfile(accountId: number) {
    let profile = await this.profileRepo.findOne({ where: { accountId } });
    if (!profile) {
      profile = this.profileRepo.create({ accountId, incomeTaxRegime: 'UNKNOWN', vatRegistered: true });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  async updateProfile(accountId: number, dto: UpdateRwandaTaxProfileDto) {
    const profile = await this.getOrCreateProfile(accountId);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  async listObligations(accountId: number) {
    return this.obligationRepo.find({ where: { accountId }, order: { dueDate: 'ASC', id: 'DESC' } });
  }

  async createObligation(accountId: number, dto: CreateTaxObligationDto) {
    const row = this.obligationRepo.create({
      accountId,
      ...dto,
      status: dto.status ?? 'PLANNED',
    });
    return this.obligationRepo.save(row);
  }

  async updateObligation(accountId: number, id: number, dto: UpdateTaxObligationDto) {
    const row = await this.obligationRepo.findOne({ where: { id, accountId } });
    if (!row) throw new NotFoundException('Tax obligation not found');
    Object.assign(row, dto);
    return this.obligationRepo.save(row);
  }

  async deleteObligation(accountId: number, id: number) {
    const row = await this.obligationRepo.findOne({ where: { id, accountId } });
    if (!row) throw new NotFoundException('Tax obligation not found');
    await this.obligationRepo.remove(row);
    return { deleted: true, id };
  }

  async buildObligationsPdf(accountId: number): Promise<Buffer> {
    const profile = await this.getOrCreateProfile(accountId);
    const obligations = await this.listObligations(accountId);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Broadway Creation — Tax obligation register', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Workspace ID: ${accountId}`);
      doc.text(`Generated (UTC): ${new Date().toISOString()}`);
      doc.moveDown();
      doc.fontSize(11).text('Tax profile (internal tracker)', { underline: true });
      doc.fontSize(10);
      doc.text(`Income tax regime: ${profile.incomeTaxRegime}`);
      doc.text(`VAT registered (tracker): ${profile.vatRegistered ? 'Yes' : 'No'}`);
      if (profile.tin) doc.text(`TIN: ${profile.tin}`);
      if (profile.notes) doc.text(`Notes: ${profile.notes}`);
      doc.moveDown();
      doc.fontSize(11).text('Obligations', { underline: true });
      doc.moveDown();
      if (!obligations.length) {
        doc.fontSize(10).text('No obligations recorded yet.');
      } else {
        obligations.forEach((o, i) => {
          doc.fontSize(10).text(`${i + 1}. [${o.taxType}] ${o.title}`);
          doc.text(
            `    Status: ${o.status} | Period: ${o.periodKey ?? '—'} | Due: ${o.dueDate ?? '—'} | Amount RWF: ${o.amountDueRwf ?? '—'}`,
          );
          if (o.rraReference) doc.text(`    RRA reference: ${o.rraReference}`);
          if (o.propertyId) doc.text(`    Property ID: ${o.propertyId}`);
          if (o.notes) doc.text(`    Notes: ${o.notes}`);
          doc.moveDown(0.4);
        });
      }
      doc.moveDown();
      doc
        .fontSize(8)
        .fillColor('#444444')
        .text(
          'Disclaimer: This PDF is an internal operational summary. Tax liability, filing dates, and assessments are determined by RRA and applicable law — verify on https://www.rra.gov.rw',
          { align: 'left' },
        );
      doc.end();
    });
  }

  async summaryForAccount(accountId: number) {
    const [profile, obligations] = await Promise.all([
      this.getOrCreateProfile(accountId),
      this.listObligations(accountId),
    ]);
    const dueSoon = obligations.filter((o) => o.status === 'DUE' || o.status === 'OVERDUE' || o.status === 'PLANNED');
    const totalDueRwf = dueSoon.reduce((s, o) => s + Number(o.amountDueRwf ?? 0), 0);
    return {
      profile,
      obligationCount: obligations.length,
      openObligationCount: dueSoon.length,
      totalTrackedDueRwf: Number(totalDueRwf.toFixed(2)),
    };
  }
}
