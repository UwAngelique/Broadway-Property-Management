import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';

@Entity({ name: 'units' })
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1, nullable: true })
  accountId?: number;

  @Column({ type: 'varchar', length: 100 })
  unitName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor?: string;

  @Column()
  buildingId: number;

  @ManyToOne(() => Building, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buildingId' })
  building: Building;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}