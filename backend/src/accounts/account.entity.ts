import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type AccountKind = 'PLATFORM' | 'LANDLORD';
export type AccountActivationStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** PLATFORM = your SaaS operator workspace; LANDLORD = property-owner client workspace */
  @Column({ type: 'varchar', length: 20, default: 'LANDLORD' })
  kind: AccountKind;

  /** For LANDLORD workspaces created under a PLATFORM account */
  @Column({ type: 'int', nullable: true })
  parentAccountId?: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Onboarding / billing gate for landlord clients you activate */
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  activationStatus: AccountActivationStatus;

  @Column({ type: 'varchar', length: 10, default: 'RWF' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billingContactName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billingContactEmail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billingContactPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankSwiftCode?: string;

  @Column({ type: 'boolean', default: true })
  vatEnabled: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 18 })
  vatRatePercent: number;

  /** Subscription tier chosen at signup (see /billing/plans). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  subscriptionPlanId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
