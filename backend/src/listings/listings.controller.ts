import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /** Public marketing feed for landing-page vacancy banners (no auth). */
  @Get('public')
  listPublic(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 12;
    return this.listingsService.listPublic(Number.isFinite(parsed) ? parsed : 12);
  }
}
