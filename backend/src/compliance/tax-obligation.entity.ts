import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TaxObligationType = 'VAT' | 'LAND' | 'PROPERTY' | 'PIT' | 'CIT' | 'RENTAL_INCOME' | 'OTHER';
export type TaxObligationStatus = 'PLANNED' | 'DUE' | 'PAID' | 'OVERDUE';

@Entity({ name: 'tax_obligations' })
export class TaxObligation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  accountId: number;

  @Column({ type: 'varchar', length: 30 })
  taxType: TaxObligationType;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  periodKey?: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  amountDueRwf?: string;

  @Column({ type: 'varchar', length: 20, default: 'PLANNED' })
  status: TaxObligationStatus;

  @Column({ type: 'varchar', length: 120, nullable: true })
  rraReference?: string;

  @Column({ type: 'int', nullable: true })
  propertyId?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
