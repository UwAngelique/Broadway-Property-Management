import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { AccountsService } from './accounts.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/roles.decorator';

import { CurrentUser } from '../auth/current-user.decorator';

import type { JwtUserPayload } from '../auth/types';

import { UpdateAccountBillingDto } from './dto/update-account-billing.dto';

import { CreateAccountUserDto } from './dto/create-account-user.dto';

import { UpdateUserActivationDto } from './dto/update-user-activation.dto';

import { AuditService } from '../audit/audit.service';

import type { Request } from 'express';



@Controller('accounts')

@UseGuards(JwtAuthGuard, RolesGuard)

export class AccountsController {

  constructor(

    private readonly accountsService: AccountsService,

    private readonly auditService: AuditService,

  ) {}



  @Get('me/billing')

  @Roles('PLATFORM_OWNER', 'OWNER', 'LAWYER', 'ACCOUNTANT')

  async getBilling(@CurrentUser() user: JwtUserPayload) {

    return this.accountsService.findOne(user.accountId);

  }



  @Patch('me/billing')

  @Roles('PLATFORM_OWNER', 'OWNER')

  async updateBilling(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateAccountBillingDto) {

    return this.accountsService.updateBilling(user.accountId, dto);

  }



  @Post('users')

  @Roles('OWNER')

  async createUser(

    @CurrentUser() user: JwtUserPayload,

    @Body() dto: CreateAccountUserDto,

    @Req() req: Request,

  ) {

    const result = await this.accountsService.createUserInAccount(user.accountId, dto);

    await this.auditService.log({

      accountId: user.accountId,

      userId: user.sub,

      userEmail: user.email,

      userRole: user.role,

      action: 'CREATE',

      resourceType: 'USER',

      resourceId: String(result.id),

      details: `Created account user ${result.email} (${result.role}), active=${result.isActive}`,

      ipAddress: req.ip,

      userAgent: req.headers['user-agent'],

    });

    return result;

  }



  @Patch('users/:userId/activation')

  @Roles('OWNER')

  async setUserActivation(

    @CurrentUser() user: JwtUserPayload,

    @Param('userId') userId: string,

    @Body() dto: UpdateUserActivationDto,

    @Req() req: Request,

  ) {

    const updated = await this.accountsService.setUserActiveInAccount(user.accountId, Number(userId), dto.isActive);

    await this.auditService.log({

      accountId: user.accountId,

      userId: user.sub,

      userEmail: user.email,

      userRole: user.role,

      action: 'EDIT',

      resourceType: 'USER',

      resourceId: String(updated.id),

      details: `User ${updated.email} activation set to ${updated.isActive}`,

      ipAddress: req.ip,

      userAgent: req.headers['user-agent'],

    });

    return updated;

  }



  @Get('users')

  @Roles('PLATFORM_OWNER', 'OWNER', 'LAWYER', 'ACCOUNTANT')

  async listUsers(@CurrentUser() user: JwtUserPayload) {

    return this.accountsService.listUsersInAccount(user.accountId);

  }

}

