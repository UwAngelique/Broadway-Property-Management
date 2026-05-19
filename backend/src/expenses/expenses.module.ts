import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Payment } from '../payments/payment.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Payment]), AuditModule],
  providers: [ExpensesService, RolesGuard],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
