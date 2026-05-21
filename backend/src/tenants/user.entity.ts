import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../accounts/account.entity';

export type UserRole = 'PLATFORM_OWNER' | 'OWNER' | 'ACCOUNTANT' | 'LAWYER' | 'TENANT';
export type UserLanguage = 'EN' | 'FR' | 'SW' | 'RW';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone?: string;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  /** MTN | AIRTEL — detected from Rwanda number prefix */
  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileNetwork?: string;

  @Column({ default: 1, nullable: true })
  accountId: number;

  @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'text', nullable: true })
  passwordHash?: string;

  @Column({ type: 'varchar', length: 20, default: 'LOCAL' })
  authProvider: 'LOCAL' | 'GOOGLE' | 'MICROSOFT' | 'PHONE';

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleSub?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  microsoftSub?: string;

  @Column({ type: 'text', nullable: true })
  refreshTokenHash?: string;

  @Column({ type: 'text', nullable: true })
  passwordResetTokenHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiresAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'TENANT' })
  role: UserRole;

  @Column({ type: 'varchar', length: 5, default: 'EN' })
  language: UserLanguage;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
