import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction =
  | 'VIEW'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'EDIT'
  | 'APPROVE'
  | 'CREATE'
  | 'LOGIN'
  | 'LOGOUT';

@Entity({ name: 'audit_events' })
export class AuditEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ type: 'varchar', length: 30 })
  userRole: string;

  @Column({ type: 'varchar', length: 20 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 80 })
  resourceType: string;

  @Column({ type: 'varchar', length: 120 })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
