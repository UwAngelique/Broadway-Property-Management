import { Body, Controller, Delete, Get, Patch, Post, Param, UseGuards, StreamableFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { ComplianceService } from './compliance.service';
import { UpdateRwandaTaxProfileDto } from './dto/update-rwanda-tax-profile.dto';
import { CreateTaxObligationDto } from './dto/create-tax-obligation.dto';
import { UpdateTaxObligationDto } from './dto/update-tax-obligation.dto';

@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('rra-resources')
  @Roles('PLATFORM_OWNER', 'OWNER', 'ACCOUNTANT', 'LAWYER', 'TENANT')
  rraResources() {
    return this.complianceService.rraResources();
  }

  @Get('profile')
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  getProfile(@CurrentUser() user: JwtUserPayload) {
    return this.complianceService.getOrCreateProfile(user.accountId);
  }

  @Patch('profile')
  @Roles('OWNER', 'ACCOUNTANT')
  updateProfile(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateRwandaTaxProfileDto) {
    return this.complianceService.updateProfile(user.accountId, dto);
  }

  @Get('obligations')
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  listObligations(@CurrentUser() user: JwtUserPayload) {
    return this.complianceService.listObligations(user.accountId);
  }

  @Get('summary')
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  summary(@CurrentUser() user: JwtUserPayload) {
    return this.complianceService.summaryForAccount(user.accountId);
  }

  @Post('obligations')
  @Roles('OWNER', 'ACCOUNTANT')
  createObligation(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateTaxObligationDto) {
    return this.complianceService.createObligation(user.accountId, dto);
  }

  @Patch('obligations/:id')
  @Roles('OWNER', 'ACCOUNTANT')
  updateObligation(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaxObligationDto,
  ) {
    return this.complianceService.updateObligation(user.accountId, Number(id), dto);
  }

  @Delete('obligations/:id')
  @Roles('OWNER', 'ACCOUNTANT')
  deleteObligation(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.complianceService.deleteObligation(user.accountId, Number(id));
  }

  @Get('obligations/export.pdf')
  @Roles('OWNER', 'ACCOUNTANT', 'LAWYER')
  async exportObligationsPdf(@CurrentUser() user: JwtUserPayload): Promise<StreamableFile> {
    const buffer = await this.complianceService.buildObligationsPdf(user.accountId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'attachment; filename="broadway-tax-obligations.pdf"',
    });
  }
}
