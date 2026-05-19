import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'expenses' })
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column({ type: 'varchar', length: 120 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amountRwf: number;

  @Column({ type: 'date' })
  expenseDate: string;

  @Column({ type: 'int', nullable: true })
  buildingId?: number;

  @Column({ type: 'int', nullable: true })
  tenantId?: number;

  @Column({ type: 'text', nullable: true })
  attachmentPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
