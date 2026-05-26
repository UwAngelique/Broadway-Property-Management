import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSigninDto } from './dto/google-signin.dto';
import { MicrosoftSigninDto } from './dto/microsoft-signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtUserPayload } from './types';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';
import { PhoneRequestOtpDto } from './dto/phone-request-otp.dto';
import { PhoneVerifyOtpDto } from './dto/phone-verify-otp.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('phone/request-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestPhoneOtp(@Body() dto: PhoneRequestOtpDto) {
    return this.authService.requestPhoneOtp(dto);
  }

  @Post('phone/verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyPhoneOtp(@Body() dto: PhoneVerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyPhoneOtp(dto).then(async (result) => {
      await this.auditService.log({
        accountId: result.user.accountId,
        userId: result.user.id,
        userEmail: result.user.email ?? dto.phone,
        userRole: result.user.role,
        action: 'LOGIN',
        resourceType: 'AUTH_SESSION',
        resourceId: String(result.user.id),
        details: 'Logged in using phone OTP',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('signup')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto).then(async (result) => {
      await this.auditService.log({
        accountId: result.user.accountId,
        userId: result.user.id,
        userEmail: result.user.email ?? '',
        userRole: result.user.role,
        action: 'CREATE',
        resourceType: 'USER',
        resourceId: String(result.user.id),
        details: `Signed up using email/password${dto.selectedPlanId ? ` (plan: ${dto.selectedPlanId})` : ''}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto).then(async (result) => {
      await this.auditService.log({
        accountId: result.user.accountId,
        userId: result.user.id,
        userEmail: result.user.email ?? '',
        userRole: result.user.role,
        action: 'LOGIN',
        resourceType: 'AUTH_SESSION',
        resourceId: String(result.user.id),
        details: 'Logged in using email/password',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('google')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  googleSignIn(@Body() dto: GoogleSigninDto, @Req() req: Request) {
    return this.authService.googleSignIn(dto).then(async (result) => {
      await this.auditService.log({
        accountId: result.user.accountId,
        userId: result.user.id,
        userEmail: result.user.email ?? '',
        userRole: result.user.role,
        action: 'LOGIN',
        resourceType: 'AUTH_SESSION',
        resourceId: String(result.user.id),
        details: 'Logged in using Google',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('microsoft')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  microsoftSignIn(@Body() dto: MicrosoftSigninDto, @Req() req: Request) {
    return this.authService.microsoftSignIn(dto).then(async (result) => {
      await this.auditService.log({
        accountId: result.user.accountId,
        userId: result.user.id,
        userEmail: result.user.email ?? '',
        userRole: result.user.role,
        action: 'LOGIN',
        resourceType: 'AUTH_SESSION',
        resourceId: String(result.user.id),
        details: 'Logged in using Microsoft',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    return this.authService.logout(user.sub).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGOUT',
        resourceType: 'AUTH_SESSION',
        resourceId: String(user.sub),
        details: 'Logged out',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUserPayload) {
    return this.authService.me(user.sub);
  }

  @Patch('me/language')
  @UseGuards(JwtAuthGuard)
  updateLanguage(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateLanguageDto) {
    return this.authService.updateLanguage(user.sub, dto.language);
  }
}
