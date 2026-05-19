import { UserRole } from '../tenants/user.entity';

export interface JwtUserPayload {
  sub: number;
  email: string;
  role: UserRole;
  accountId: number;
}
