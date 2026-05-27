import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicVacancyListing } from './public-vacancy-listing.entity';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(PublicVacancyListing)
    private readonly listingsRepo: Repository<PublicVacancyListing>,
  ) {}

  async listPublic(limit = 12) {
    const now = new Date();
    const rows = await this.listingsRepo.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
      take: Math.min(limit, 50),
    });

    return rows
      .filter((row) => !row.expiresAt || row.expiresAt > now)
      .map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        locationLabel: row.locationLabel ?? null,
        rentRwf: row.rentRwf != null ? Number(row.rentRwf) : null,
        contactPhone: row.contactPhone ?? null,
        contactEmail: row.contactEmail ?? null,
        publishedAt: row.publishedAt.toISOString(),
      }));
  }
}
