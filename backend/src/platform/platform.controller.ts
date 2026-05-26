import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { PlatformService } from './platform.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateClientWorkspaceDto } from '../accounts/dto/create-client-workspace.dto';
import { UpdateClientActivationDto } from './dto/update-client-activation.dto';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';

@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('overview')
  @Roles('PLATFORM_OWNER')
  overview(@CurrentUser() user: JwtUserPayload) {
    return this.platformService.getOverview(user.accountId);
  }

  @Get('finance')
  @Roles('PLATFORM_OWNER')
  finance(@CurrentUser() user: JwtUserPayload) {
    return this.platformService.getFinanceRollup(user.accountId);
  }

  @Get('tax')
  @Roles('PLATFORM_OWNER')
  tax(@CurrentUser() user: JwtUserPayload) {
    return this.platformService.getTaxRollup(user.accountId);
  }

  @Post('clients/workspace')
  @Roles('PLATFORM_OWNER')
  async createClientWorkspace(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateClientWorkspaceDto,
    @Req() req: Request,
  ) {
    const result = await this.accountsService.createClientWorkspace(user.accountId, dto);
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'CLIENT_WORKSPACE',
      resourceId: String(result.accountId),
      details: `Provisioned landlord workspace ${result.workspaceName} (${result.activationStatus})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Patch('clients/:accountId/activation')
  @Roles('PLATFORM_OWNER')
  async setClientActivation(
    @CurrentUser() user: JwtUserPayload,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateClientActivationDto,
    @Req() req: Request,
  ) {
    const updated = await this.accountsService.setLandlordClientActivation(
      user.accountId,
      Number(accountId),
      dto.status,
    );
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'EDIT',
      resourceType: 'CLIENT_WORKSPACE',
      resourceId: String(updated.id),
      details: `Client workspace activation set to ${updated.activationStatus}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return {
      accountId: updated.id,
      activationStatus: updated.activationStatus,
      isActive: updated.isActive,
    };
  }
}
