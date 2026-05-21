import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'otp_verifications' })
export class OtpVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text' })
  codeHash: string;

  @Column({ type: 'varchar', length: 30, default: 'LOGIN' })
  purpose: 'LOGIN' | 'SIGNUP';

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
