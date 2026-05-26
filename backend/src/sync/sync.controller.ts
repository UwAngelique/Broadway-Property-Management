import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /** Pull latest dashboard snapshot; pass ?revision= from last pull to skip body when unchanged. */
  @Get('pull')
  pull(@CurrentUser() user: JwtUserPayload, @Query('revision') revision?: string) {
    return this.syncService.pull(user, revision);
  }
}
