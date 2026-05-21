import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { BankStatement } from './bank-statement.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { Payment } from '../payments/payment.entity';

export type ParsedTxn = {
  txnDate?: string;
  amountRwf?: number;
  reference?: string;
  description?: string;
};

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(BankStatement)
    private readonly statementsRepo: Repository<BankStatement>,
    @InjectRepository(BankStatementLine)
    private readonly linesRepo: Repository<BankStatementLine>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
  ) {}

  async uploadStatement(accountId: number, file: Express.Multer.File, userId: number) {
    const dir = path.resolve('uploads/statements');
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(dest, file.buffer);

    let parsedText = '';
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(file.buffer);
      parsedText = data.text ?? '';
    } else if (file.mimetype?.startsWith('text/') || file.originalname.endsWith('.csv')) {
      parsedText = file.buffer.toString('utf8');
    }

    const statement = await this.statementsRepo.save(
      this.statementsRepo.create({
        accountId,
        filePath: dest,
        originalName: file.originalname,
        parsedText,
        uploadedByUserId: userId,
      }),
    );

    const txns = this.extractTransactions(parsedText);
    const lines = await this.linesRepo.save(
      txns.map((txn) =>
        this.linesRepo.create({
          statementId: statement.id,
          accountId,
          txnDate: txn.txnDate,
          amountRwf: txn.amountRwf,
          reference: txn.reference,
          description: txn.description,
          matchStatus: 'UNMATCHED',
        }),
      ),
    );

    const matchResult = await this.matchStatementToPayments(accountId, statement.id);
    return {
      statementId: statement.id,
      lineCount: lines.length,
      ...matchResult,
    };
  }

  extractTransactions(text: string): ParsedTxn[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const txns: ParsedTxn[] = [];

    for (const line of lines) {
      const amountMatch =
        line.match(/(?:RWF|FRW|rwf)\s*([\d,]+(?:\.\d{2})?)/i) ??
        line.match(/([\d,]+(?:\.\d{2})?)\s*(?:RWF|FRW)/i) ??
        line.match(/\b([\d]{3,}(?:,\d{3})*(?:\.\d{2})?)\b/);
      if (!amountMatch) continue;

      const amountRaw = amountMatch[1].replace(/,/g, '');
      const amountRwf = Number(amountRaw);
      if (!Number.isFinite(amountRwf) || amountRwf < 100) continue;

      const dateMatch =
        line.match(/\b(\d{4}-\d{2}-\d{2})\b/) ??
        line.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/) ??
        line.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{2})\b/);
      let txnDate: string | undefined;
      if (dateMatch) {
        const d = dateMatch[1];
        if (d.includes('-') && d.length === 10) txnDate = d;
        else {
          const parts = d.split(/[\/\-]/);
          if (parts.length === 3) {
            const [a, b, c] = parts.map(Number);
            txnDate = c > 31 ? `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}` : `20${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
          }
        }
      }

      const refMatch = line.match(/(?:ref|reference|txn|id)[:\s#]*([A-Za-z0-9\-]{6,})/i);
      txns.push({
        txnDate,
        amountRwf,
        reference: refMatch?.[1],
        description: line.slice(0, 500),
      });
    }

    return txns.slice(0, 500);
  }

  async matchStatementToPayments(accountId: number, statementId: number) {
    const lines = await this.linesRepo.find({ where: { accountId, statementId } });
    const pending = await this.paymentsRepo.find({
      where: { accountId, status: 'SUBMITTED' },
      order: { id: 'DESC' },
      take: 500,
    });

    let suggested = 0;
    let confirmed = 0;

    for (const line of lines) {
      let best: { payment: Payment; score: number } | null = null;

      for (const payment of pending) {
        const score = this.scoreMatch(line, payment);
        if (score >= 0.55 && (!best || score > best.score)) {
          best = { payment, score };
        }
      }

      if (best) {
        line.matchedPaymentId = best.payment.id;
        line.matchScore = Number((best.score * 100).toFixed(2));
        line.matchStatus = best.score >= 0.85 ? 'CONFIRMED' : 'SUGGESTED';
        if (line.matchStatus === 'CONFIRMED') confirmed++;
        else suggested++;
        await this.linesRepo.save(line);
      }
    }

    return {
      scannedLines: lines.length,
      pendingPayments: pending.length,
      suggestedMatches: suggested,
      autoConfirmed: confirmed,
    };
  }

  scoreMatch(line: BankStatementLine, payment: Payment): number {
    let score = 0;
    const payAmount = Number(payment.amountRwf ?? 0);
    const lineAmount = Number(line.amountRwf ?? 0);

    if (payAmount > 0 && lineAmount > 0) {
      const diff = Math.abs(payAmount - lineAmount);
      if (diff === 0) score += 0.45;
      else if (diff / payAmount < 0.02) score += 0.35;
      else if (diff / payAmount < 0.05) score += 0.2;
    }

    const proofRef = (payment.bankReference ?? '').toLowerCase();
    const lineRef = (line.reference ?? line.description ?? '').toLowerCase();
    if (proofRef && lineRef) {
      if (lineRef.includes(proofRef) || proofRef.includes(lineRef)) score += 0.35;
      else {
        const tokens = proofRef.split(/\s+/).filter((t) => t.length >= 6);
        if (tokens.some((t) => lineRef.includes(t))) score += 0.25;
      }
    }

    if (line.txnDate && payment.createdAt) {
      const days = Math.abs(
        (new Date(line.txnDate).getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days <= 3) score += 0.2;
      else if (days <= 7) score += 0.1;
    }

    return Math.min(1, score);
  }

  async confirmMatch(accountId: number, lineId: number, approve: boolean) {
    const line = await this.linesRepo.findOne({ where: { id: lineId, accountId } });
    if (!line?.matchedPaymentId) return { ok: false };

    if (approve) {
      line.matchStatus = 'CONFIRMED';
      await this.linesRepo.save(line);
      const payment = await this.paymentsRepo.findOne({
        where: { id: line.matchedPaymentId, accountId },
      });
      if (payment && payment.status === 'SUBMITTED') {
        payment.status = 'APPROVED';
        payment.landlordNote = 'Auto-approved via bank statement reconciliation';
        await this.paymentsRepo.save(payment);
      }
      return { ok: true, paymentId: line.matchedPaymentId };
    }

    line.matchStatus = 'REJECTED';
    await this.linesRepo.save(line);
    return { ok: true };
  }

  async listStatements(accountId: number) {
    return this.statementsRepo.find({
      where: { accountId },
      order: { id: 'DESC' },
      relations: ['lines'],
    });
  }

  /** Extract text from payment proof PDF for matching hints */
  async parseProofFile(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) return '';
      if (!filePath.toLowerCase().endsWith('.pdf')) return '';
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text ?? '';
    } catch (e) {
      this.logger.warn(`Proof PDF parse failed: ${filePath}`);
      return '';
    }
  }
}
