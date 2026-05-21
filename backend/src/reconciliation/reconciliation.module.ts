import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankStatement } from './bank-statement.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { Payment } from '../payments/payment.entity';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankStatement, BankStatementLine, Payment])],
  providers: [ReconciliationService],
  controllers: [ReconciliationController],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
