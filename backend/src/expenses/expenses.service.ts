import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Payment } from '../payments/payment.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
  ) {}

  create(accountId: number, dto: CreateExpenseDto, attachmentPath?: string) {
    const item = this.expensesRepo.create({
      accountId,
      ...dto,
      attachmentPath,
    });
    return this.expensesRepo.save(item);
  }

  list(accountId: number) {
    return this.expensesRepo.find({ where: { accountId }, order: { id: 'DESC' } });
  }

  async update(accountId: number, id: number, dto: UpdateExpenseDto) {
    const item = await this.expensesRepo.findOne({ where: { accountId, id } });
    if (!item) throw new NotFoundException('Expense not found');
    Object.assign(item, dto);
    return this.expensesRepo.save(item);
  }

  async remove(accountId: number, id: number) {
    const item = await this.expensesRepo.findOne({ where: { accountId, id } });
    if (!item) throw new NotFoundException('Expense not found');
    await this.expensesRepo.remove(item);
    return { deleted: true };
  }

  async summary(accountId: number) {
    const [expenses, payments] = await Promise.all([
      this.expensesRepo.find({ where: { accountId } }),
      this.paymentsRepo.find({ where: { accountId } }),
    ]);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amountRwf), 0);
    const totalIncome = payments
      .filter((item) => ['APPROVED', 'RECEIPT_ISSUED', 'RECEIPT_REQUESTED'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.amountRwf), 0);
    return {
      totalExpensesRwf: Number(totalExpenses.toFixed(2)),
      totalIncomeRwf: Number(totalIncome.toFixed(2)),
      netCashflowRwf: Number((totalIncome - totalExpenses).toFixed(2)),
    };
  }
}
