import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  overview(@CurrentUser() user: JwtUserPayload) {
    return this.analyticsService.getOverview(user.accountId);
  }

  @Get('revenue-trend')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  revenueTrend(@CurrentUser() user: JwtUserPayload) {
    return this.analyticsService.getRevenueTrend(user.accountId);
  }

  @Get('building-performance')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  buildingPerformance(@CurrentUser() user: JwtUserPayload) {
    return this.analyticsService.getBuildingPerformance(user.accountId);
  }

  @Get('team-roles')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  teamRoles(@CurrentUser() user: JwtUserPayload) {
    return this.analyticsService.getTeamRoleCounts(user.accountId);
  }

  @Get('annual-forecast')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  annualForecast(@CurrentUser() user: JwtUserPayload, @Query('year') year?: string) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.analyticsService.getAnnualForecast(user.accountId, y);
  }

  @Post('annual-forecast/manual-lines')
  @Roles('OWNER', 'ACCOUNTANT')
  addManualLine(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: { year: number; label: string; monthlyRentRwf: number },
  ) {
    return this.analyticsService.addManualIncomeLine(
      user.accountId,
      body.year,
      body.label,
      body.monthlyRentRwf,
    );
  }

  @Delete('annual-forecast/manual-lines/:id')
  @Roles('OWNER', 'ACCOUNTANT')
  removeManualLine(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.analyticsService.removeManualIncomeLine(user.accountId, Number(id));
  }
}
