import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BankStatementLine } from './bank-statement-line.entity';

@Entity({ name: 'bank_statements' })
export class BankStatement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  originalName?: string;

  @Column({ type: 'date', nullable: true })
  periodStart?: string;

  @Column({ type: 'date', nullable: true })
  periodEnd?: string;

  @Column({ type: 'text', nullable: true })
  parsedText?: string;

  @Column({ type: 'int', nullable: true })
  uploadedByUserId?: number;

  @OneToMany(() => BankStatementLine, (line) => line.statement)
  lines: BankStatementLine[];

  @CreateDateColumn()
  createdAt: Date;
}
