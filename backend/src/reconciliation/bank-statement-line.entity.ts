import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { BankStatement } from './bank-statement.entity';

@Entity({ name: 'bank_statement_lines' })
export class BankStatementLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  statementId: number;

  @ManyToOne(() => BankStatement, (s) => s.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statementId' })
  statement: BankStatement;

  @Column()
  accountId: number;

  @Column({ type: 'date', nullable: true })
  txnDate?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  amountRwf?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  matchedPaymentId?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  matchScore?: number;

  @Column({ type: 'varchar', length: 20, default: 'UNMATCHED' })
  matchStatus: 'UNMATCHED' | 'SUGGESTED' | 'CONFIRMED' | 'REJECTED';

  @CreateDateColumn()
  createdAt: Date;
}
