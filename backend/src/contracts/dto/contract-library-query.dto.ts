export class ContractLibraryQueryDto {
  tenantId?: number;
  view?: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  expiringInDays?: number;
}
