import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { ReconciliationService } from './reconciliation.service';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('statements/upload')
  @Roles('OWNER', 'ACCOUNTANT', 'PLATFORM_OWNER')
  @UseInterceptors(FileInterceptor('file'))
  uploadStatement(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reconciliationService.uploadStatement(user.accountId, file, user.sub);
  }

  @Get('statements')
  @Roles('OWNER', 'ACCOUNTANT', 'PLATFORM_OWNER')
  list(@CurrentUser() user: JwtUserPayload) {
    return this.reconciliationService.listStatements(user.accountId);
  }

  @Post('lines/:lineId/confirm')
  @Roles('OWNER', 'ACCOUNTANT')
  confirm(
    @CurrentUser() user: JwtUserPayload,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() body: { approve: boolean },
  ) {
    return this.reconciliationService.confirmMatch(user.accountId, lineId, body.approve);
  }

  @Post('run')
  @Roles('OWNER', 'ACCOUNTANT')
  run(@CurrentUser() user: JwtUserPayload) {
    const statements = this.reconciliationService.listStatements(user.accountId);
    return statements;
  }
}
