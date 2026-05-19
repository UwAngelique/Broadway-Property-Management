import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { ContractsService } from './contracts.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { CreateContractDto } from './dto/create-contract.dto';
import { AddContractVersionDto } from './dto/add-contract-version.dto';
import { ContractLibraryQueryDto } from './dto/contract-library-query.dto';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly auditService: AuditService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post()
  @Roles('OWNER', 'LAWYER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/contracts',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `contract-v1-${unique}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  createContractV1(
    @Body() dto: CreateContractDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    if (!file?.path) {
      throw new BadRequestException('Lease PDF file is required');
    }
    return this.contractsService.createContractV1(dto, file.path, user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'UPLOAD',
        resourceType: 'CONTRACT_VERSION',
        resourceId: String(result.version.id),
        details: `Uploaded contract V1 for contract ${result.contract.id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post(':contractId/versions')
  @Roles('OWNER', 'LAWYER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/contracts',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `contract-version-${unique}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  addVersion(
    @Param('contractId') contractId: string,
    @Body() dto: AddContractVersionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    if (!file?.path) {
      throw new BadRequestException('Lease PDF file is required');
    }
    return this.contractsService
      .addVersion(Number(contractId), dto, file.path, user.accountId)
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'EDIT',
          resourceType: 'CONTRACT_VERSION',
          resourceId: String(result.version.id),
          details: `Added contract version ${result.version.versionNumber} to contract ${contractId}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Patch(':contractId/approve')
  @Roles('OWNER', 'LAWYER')
  approve(@Param('contractId') contractId: string, @CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    return this.contractsService.approve(Number(contractId), user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'APPROVE',
        resourceType: 'CONTRACT',
        resourceId: contractId,
        details: `Approved contract ${contractId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Patch(':contractId/rent')
  @Roles('OWNER', 'ACCOUNTANT')
  updateRent(
    @Param('contractId') contractId: string,
    @Body() body: { rentAmountRwf: number },
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.contractsService.updateCurrentRent(Number(contractId), user.accountId, Number(body.rentAmountRwf));
  }

  @Get()
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async findAll(@Query() query: ContractLibraryQueryDto, @CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    if (user.role === 'TENANT') {
      query.tenantId = await this.tenantsService.findProfileIdByUserId(user.sub, user.accountId);
    }
    return this.contractsService.findAll(query, user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'VIEW',
        resourceType: 'CONTRACT',
        resourceId: query.tenantId ? `tenant:${String(query.tenantId)}` : 'all',
        details: `Viewed contract library (filter=${query.view ?? 'NONE'})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Get(':contractId/versions')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  findVersionHistory(
    @Param('contractId') contractId: string,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.contractsService.findVersionHistory(Number(contractId), user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'VIEW',
        resourceType: 'CONTRACT_VERSION',
        resourceId: `history:${contractId}`,
        details: `Viewed version history for contract ${contractId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Get(':contractId/versions/by-number/:versionNumber/download')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  downloadVersionByNumber(
    @Param('contractId') contractId: string,
    @Param('versionNumber') versionNumber: string,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.streamVersionDownload(contractId, versionNumber, user, req);
  }

  @Get(':contractId/versions/:versionId/download')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async downloadVersion(
    @Param('contractId') contractId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.streamVersionDownload(contractId, versionId, user, req);
  }

  private async streamVersionDownload(
    contractId: string,
    versionIdOrNumber: string,
    user: JwtUserPayload,
    req: Request,
  ) {
    const version = await this.contractsService.findVersion(Number(contractId), Number(versionIdOrNumber), user.accountId);
    if (!fs.existsSync(version.filePath)) {
      throw new NotFoundException('Contract file not found');
    }
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'DOWNLOAD',
      resourceType: 'CONTRACT_VERSION',
      resourceId: String(version.id),
      details: `Downloaded contract v${version.versionNumber} (id ${version.id}) for contract ${contractId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return new StreamableFile(fs.createReadStream(version.filePath));
  }
}
