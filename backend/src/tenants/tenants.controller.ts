import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  UseGuards,
  Req,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { TenantsService } from './tenants.service';
import { TenantSignupDto } from './dto/tenant-signup.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
  ) {}

  @Post('signup')
  @Roles('OWNER', 'LAWYER')
  signup(@Body() dto: TenantSignupDto, @CurrentUser() user: JwtUserPayload) {
    dto.accountId = user.accountId;
    return this.tenantsService.signup(dto);
  }

  @Get()
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  findAll(@CurrentUser() user: JwtUserPayload) {
    return this.tenantsService.findAll(user.accountId);
  }

  @Get(':id')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    return this.tenantsService.findOne(Number(id), user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'VIEW',
        resourceType: 'TENANT_PROFILE',
        resourceId: id,
        details: `Viewed tenant profile ${id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Patch(':id')
  @Roles('OWNER', 'LAWYER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantProfileDto,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.tenantsService.update(Number(id), dto, user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'EDIT',
        resourceType: 'TENANT_PROFILE',
        resourceId: id,
        details: `Edited tenant profile ${id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post(':id/rdb-certificate')
  @Roles('OWNER', 'LAWYER', 'TENANT')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/rdb',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `rdb-${unique}${ext}`);
        },
      }),
    }),
  )
  async uploadRdbCertificate(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    if (!file?.path) {
      throw new BadRequestException('RDB certificate file is required');
    }
    const saved = await this.tenantsService.setRdbCertificatePath(
      Number(id),
      file.path,
      user.accountId,
    );
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPLOAD',
      resourceType: 'RDB_CERTIFICATE',
      resourceId: id,
      details: `Uploaded RDB certificate for tenant ${id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { tenantId: saved.id, rdbCertificatePath: saved.rdbCertificatePath };
  }

  @Get(':id/rdb-certificate/download')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async downloadRdbCertificate(@Param('id') id: string, @CurrentUser() user: JwtUserPayload, @Req() req: Request) {
  const tenant = await this.tenantsService.findOne(Number(id), user.accountId);

  if (!tenant.rdbCertificatePath || !fs.existsSync(tenant.rdbCertificatePath)) {
    throw new NotFoundException('RDB certificate not found');
  }

  await this.auditService.log({
    accountId: user.accountId,
    userId: user.sub,
    userEmail: user.email,
    userRole: user.role,
    action: 'DOWNLOAD',
    resourceType: 'RDB_CERTIFICATE',
    resourceId: id,
    details: `Downloaded RDB certificate for tenant ${id}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  return new StreamableFile(fs.createReadStream(tenant.rdbCertificatePath));
}

   
}
