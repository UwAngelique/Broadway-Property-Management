import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type IncomeTaxRegime = 'PIT' | 'CIT' | 'UNKNOWN';

@Entity({ name: 'rwanda_tax_profiles' })
export class RwandaTaxProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  accountId: number;

  /** Personal vs corporate income tax posture for RRA (see RRA guidance). */
  @Column({ type: 'varchar', length: 20, default: 'UNKNOWN' })
  incomeTaxRegime: IncomeTaxRegime;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tin?: string;

  @Column({ type: 'boolean', default: true })
  vatRegistered: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
