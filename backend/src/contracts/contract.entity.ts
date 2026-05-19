import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantProfile } from '../tenants/tenant-profile.entity';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

@Entity({ name: 'contracts' })
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column()
  tenantId: number;

  @ManyToOne(() => TenantProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantProfile;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status: ContractStatus;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ type: 'int', nullable: true })
  currentVersionNumber?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
