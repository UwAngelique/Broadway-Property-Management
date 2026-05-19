import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuditService } from '../audit/audit.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/expenses',
        filename: (_req, file, cb) => {
          const ext = file?.originalname ? path.extname(file.originalname) : '';
          cb(null, `expense-${Date.now()}${ext || '.bin'}`);
        },
      }),
    }),
  )
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: Record<string, string>,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!body.category?.trim() || !body.description?.trim() || !body.expenseDate) {
      throw new BadRequestException('category, description, and expenseDate are required');
    }
    const dto: CreateExpenseDto = {
      category: body.category.trim(),
      description: body.description.trim(),
      amountRwf: Number(body.amountRwf),
      expenseDate: body.expenseDate,
      buildingId: body.buildingId != null && body.buildingId !== '' ? Number(body.buildingId) : undefined,
      tenantId: body.tenantId != null && body.tenantId !== '' ? Number(body.tenantId) : undefined,
    };
    return this.expensesService.create(user.accountId, dto, file?.path).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'CREATE',
        resourceType: 'EXPENSE',
        resourceId: String(result.id),
        details: 'Created expense entry',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  list(@CurrentUser() user: JwtUserPayload) {
    return this.expensesService.list(user.accountId);
  }

  @Get('summary')
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  summary(@CurrentUser() user: JwtUserPayload) {
    return this.expensesService.summary(user.accountId);
  }

  @Patch(':id')
  @Roles('OWNER', 'ACCOUNTANT')
  update(@CurrentUser() user: JwtUserPayload, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(user.accountId, Number(id), dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.expensesService.remove(user.accountId, Number(id));
  }
}
