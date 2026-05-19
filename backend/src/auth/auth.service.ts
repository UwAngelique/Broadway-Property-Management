import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { compare, hash } from 'bcrypt-ts';
import { Repository } from 'typeorm';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { User } from '../tenants/user.entity';
import { AccountsService } from '../accounts/accounts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSigninDto } from './dto/google-signin.dto';
import { MicrosoftSigninDto } from './dto/microsoft-signin.dto';
import { JwtUserPayload } from './types';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  private readonly microsoftJwks = createRemoteJWKSet(
    new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'),
  );

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    if (!dto.password) {
      throw new BadRequestException('Password is required for email signup');
    }

    const accountId = await this.resolveAccountId(dto.accountId, dto.accountName, dto.email);
    if (dto.selectedPlanId) {
      await this.accountsService.setSubscriptionPlan(accountId, dto.selectedPlanId);
    }
    const passwordHash = await hash(dto.password, 10);
    const isNewWorkspace = !dto.accountId;
    const defaultRole = isNewWorkspace ? 'OWNER' : 'TENANT';
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      role: dto.role ?? defaultRole,
      language: dto.language ?? 'EN',
      isActive: true,
      accountId,
      authProvider: 'LOCAL',
    });
    const savedUser = await this.usersRepo.save(user);
    await this.assertUserMayAuthenticate(savedUser);
    return this.buildAuthResponse(savedUser);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.assertUserMayAuthenticate(user);
    return this.buildAuthResponse(user);
  }

  async googleSignIn(dto: GoogleSigninDto) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.usersRepo.findOne({ where: { email: payload.email } });
    if (!user) {
      const accountId = await this.resolveAccountId(dto.accountId, dto.accountName, payload.email);
      user = this.usersRepo.create({
        email: payload.email,
        role: 'TENANT',
        language: 'EN',
        isActive: true,
        accountId,
        authProvider: 'GOOGLE',
        googleSub: payload.sub,
      });
      user = await this.usersRepo.save(user);
    } else if (!user.googleSub) {
      user.googleSub = payload.sub;
      user.authProvider = 'GOOGLE';
      user = await this.usersRepo.save(user);
    }

    await this.assertUserMayAuthenticate(user);
    return this.buildAuthResponse(user);
  }

  async me(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const account = user.accountId ? await this.accountsService.findOne(user.accountId) : null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      language: user.language,
      accountId: user.accountId,
      authProvider: user.authProvider,
      isActive: user.isActive,
      accountKind: account?.kind,
      accountActivationStatus: account?.activationStatus,
      parentAccountId: account?.parentAccountId,
      subscriptionPlanId: account?.subscriptionPlanId,
    };
  }

  async microsoftSignIn(dto: MicrosoftSigninDto) {
    if (!process.env.MICROSOFT_CLIENT_ID) {
      throw new BadRequestException('MICROSOFT_CLIENT_ID is not configured');
    }
    const verified = await jwtVerify(dto.idToken, this.microsoftJwks, {
      audience: process.env.MICROSOFT_CLIENT_ID,
      issuer: [
        'https://login.microsoftonline.com/common/v2.0',
        'https://login.microsoftonline.com/consumers/v2.0',
        'https://login.microsoftonline.com/organizations/v2.0',
      ],
    });
    const email =
      (typeof verified.payload.email === 'string' && verified.payload.email) ||
      (typeof verified.payload.preferred_username === 'string' && verified.payload.preferred_username);
    const subject = typeof verified.payload.sub === 'string' ? verified.payload.sub : undefined;
    if (!email || !subject) {
      throw new UnauthorizedException('Invalid Microsoft token');
    }

    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      const accountId = await this.resolveAccountId(dto.accountId, dto.accountName, email);
      user = this.usersRepo.create({
        email,
        role: 'TENANT',
        language: 'EN',
        isActive: true,
        accountId,
        authProvider: 'MICROSOFT',
        microsoftSub: subject,
      });
      user = await this.usersRepo.save(user);
    } else if (!user.microsoftSub) {
      user.microsoftSub = subject;
      user.authProvider = 'MICROSOFT';
      user = await this.usersRepo.save(user);
    }

    await this.assertUserMayAuthenticate(user);
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: JwtUserPayload;
    try {
      payload = this.jwtService.verify<JwtUserPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token not recognized');
    }
    const valid = await compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }
    await this.assertUserMayAuthenticate(user);
    return this.buildAuthResponse(user);
  }

  async logout(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.refreshTokenHash = undefined;
    await this.usersRepo.save(user);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      return { success: true };
    }
    const plainToken = randomBytes(24).toString('hex');
    user.passwordResetTokenHash = await hash(plainToken, 10);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    user.passwordResetTokenExpiresAt = expiresAt;
    await this.usersRepo.save(user);

    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.APP_URL ?? 'http://localhost:3001';
    const resetLink = `${appUrl}/?reset=${encodeURIComponent(plainToken)}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await this.notificationsService.sendEmail(
        user.email,
        'Broadway Property Management — password reset',
        `Use this link within 30 minutes to reset your password:\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
      );
      return { success: true, message: 'If your email exists, a reset link has been sent.' };
    }

    if (isProduction) {
      return { success: true, message: 'If your email exists, a reset process has been started.' };
    }

    return {
      success: true,
      resetToken: plainToken,
      expiresAt: expiresAt.toISOString(),
      note: 'Development only: use this token in reset password form.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.usersRepo.find();
    const now = new Date();
    for (const user of users) {
      if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) continue;
      if (user.passwordResetTokenExpiresAt < now) continue;
      const match = await compare(token, user.passwordResetTokenHash);
      if (!match) continue;
      user.passwordHash = await hash(newPassword, 10);
      user.passwordResetTokenHash = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      await this.usersRepo.save(user);
      return { success: true };
    }
    throw new UnauthorizedException('Invalid or expired reset token');
  }

  private async resolveAccountId(accountId: number | undefined, accountName: string | undefined, email: string) {
    if (accountId) {
      const account = await this.accountsService.findOne(accountId);
      if (!account) {
        throw new BadRequestException('Account not found');
      }
      return account.id;
    }
    const name = accountName ?? `${email.split('@')[0]} Workspace`;
    const account = await this.accountsService.createLandlordAccount(name);
    return account.id;
  }

  private async assertUserMayAuthenticate(user: User) {
    if (!user.isActive) {
      throw new UnauthorizedException('Your access is disabled. Contact your administrator.');
    }
    if (!user.accountId) {
      throw new UnauthorizedException('Account not assigned');
    }
    const account = await this.accountsService.findOne(user.accountId);
    if (!account) {
      throw new UnauthorizedException('Workspace not found');
    }
    if (!account.isActive) {
      throw new UnauthorizedException('Workspace is disabled.');
    }
    if (account.activationStatus === 'SUSPENDED') {
      throw new UnauthorizedException('Workspace is suspended. Contact support.');
    }
    if (account.activationStatus === 'PENDING') {
      throw new UnauthorizedException(
        account.kind === 'PLATFORM'
          ? 'Platform workspace is pending activation.'
          : 'Workspace is pending activation by your service provider.',
      );
    }
  }

  private async buildAuthResponse(user: User) {
    const account = user.accountId ? await this.accountsService.findOne(user.accountId) : null;
    const jwtPayload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      accountId: user.accountId,
    };
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret-change-me',
      expiresIn: '30d',
    });
    await this.storeRefreshToken(user.id, refreshToken);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        language: user.language,
        accountId: user.accountId,
        isActive: user.isActive,
        accountKind: account?.kind,
        accountActivationStatus: account?.activationStatus,
        parentAccountId: account?.parentAccountId,
        subscriptionPlanId: account?.subscriptionPlanId,
      },
    };
  }

  private async storeRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }
    user.refreshTokenHash = await hash(refreshToken, 10);
    await this.usersRepo.save(user);
  }
}
