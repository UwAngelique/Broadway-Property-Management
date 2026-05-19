import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Parcel / asset registered in Rwanda (UPI + admin divisions). */
export type BuildingPropertyKind = 'BUILDING' | 'LAND_PARCEL';
export type BuildingUsageType = 'COMMERCIAL' | 'RESIDENTIAL' | 'MIXED' | 'LAND_ONLY';

@Entity({ name: 'buildings' })
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  /** Rwanda Unique Parcel Identifier (when registered) */
  @Column({ type: 'varchar', length: 80, nullable: true })
  upi?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'BUILDING' })
  propertyKind: BuildingPropertyKind;

  @Column({ type: 'varchar', length: 20, default: 'COMMERCIAL' })
  usageType: BuildingUsageType;

  @Column({ type: 'varchar', length: 120, nullable: true })
  district?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sector?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cell?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  village?: string | null;

  @Column({ type: 'double precision', nullable: true })
  landSizeSqm?: number | null;

  @Column({ type: 'varchar', length: 10, default: 'RWF' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}