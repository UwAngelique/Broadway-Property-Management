export class TenantSignupDto {
  email: string;
  password: string;
  accountId: number;

  language?: 'EN' | 'FR' | 'SW' | 'RW';

  unitId: number;

  fullName: string;
  companyName: string;
  businessSector: string;
  tinNumber: string;

  phone: string;
  address?: string;
}