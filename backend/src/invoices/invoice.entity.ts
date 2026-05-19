import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column()
  tenantId: number;

  @Column()
  contractId: number;

  @Column({ type: 'varchar', length: 7 })
  billingMonth: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  baseAmountRwf: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 18 })
  vatRatePercent: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  vatAmountRwf: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalAmountRwf: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: InvoiceStatus;

  @Column({ type: 'text', nullable: true })
  pdfPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
