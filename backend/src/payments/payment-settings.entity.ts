import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'payment_settings' })
export class PaymentSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, default: 1 })
  accountId: number;

  @Column({ type: 'boolean', default: true })
  enableBankTransferProof: boolean;

  @Column({ type: 'boolean', default: false })
  enableBankGateway: boolean;

  @Column({ type: 'boolean', default: true })
  enableMtnMomo: boolean;

  @Column({ type: 'boolean', default: true })
  enableAirtelMoney: boolean;

  @Column({ type: 'boolean', default: false })
  enableManualEbmByLandlord: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankGatewayProvider?: string;

  @Column({ type: 'simple-array', nullable: true })
  enabledBankCodes?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
