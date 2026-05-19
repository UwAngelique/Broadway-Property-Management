import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { BuildingPropertyKind, BuildingUsageType } from '../building.entity';

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  upi?: string;

  @IsOptional()
  @IsIn(['BUILDING', 'LAND_PARCEL'])
  propertyKind?: BuildingPropertyKind;

  @IsOptional()
  @IsIn(['COMMERCIAL', 'RESIDENTIAL', 'MIXED', 'LAND_ONLY'])
  usageType?: BuildingUsageType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sector?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cell?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  village?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  landSizeSqm?: number;
}
