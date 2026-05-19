import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Contract } from './contract.entity';

export type UploadedByRole = 'OWNER' | 'LAWYER';

@Entity({ name: 'contract_versions' })
export class ContractVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column()
  contractId: number;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ type: 'varchar', length: 20 })
  uploadedByRole: UploadedByRole;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  rentAmountRwf: number;

  @Column({ type: 'varchar', length: 20, default: 'MONTHLY' })
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @Column({ type: 'int', default: 5 })
  dueDayOfMonth: number;

  // Automation config per version
  @Column({ type: 'boolean', default: false })
  automationEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  autoInvoice: boolean;

  @Column({ type: 'boolean', default: false })
  autoIncrement: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  incrementPercentage?: number;

  @Column({ type: 'date', nullable: true })
  incrementStartDate?: string;

  @Column({ type: 'int', default: 60 })
  reminderDaysBeforeEnd: number; // ✅ default 60 days as requested

  @Column({ type: 'boolean', default: false })
  autoDisableOnEnd: boolean;

  @CreateDateColumn()
  createdAt: Date;
}