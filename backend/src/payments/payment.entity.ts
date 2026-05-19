import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'BANK_GATEWAY'
  | 'MTN_MOMO'
  | 'AIRTEL_MONEY'
  | 'CASH';
export type PaymentStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIPT_REQUESTED'
  | 'RECEIPT_ISSUED';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column()
  tenantId: number;

  @Column({ type: 'int', nullable: true })
  contractId?: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amountRwf: number;

  @Column({ type: 'varchar', length: 20 })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 30, default: 'SUBMITTED' })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  bankReference?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankCode?: string;

  @Column({ type: 'simple-array', nullable: true })
  billingMonths?: string[];

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  monthlyRateRwf?: number;

  @Column({ type: 'text', nullable: true })
  proofPath?: string;

  @Column({ type: 'boolean', default: false })
  receiptRequested: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rraPurchaseCode?: string;

  @Column({ type: 'text', nullable: true })
  ebmReceiptPath?: string;

  @Column({ type: 'text', nullable: true })
  landlordNote?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
