import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum SearchCategory {
  ALL = 'ALL',
  DOCTOR = 'DOCTOR',
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  SPECIALTY = 'SPECIALTY',
  SERVICE = 'SERVICE',
}

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  DISTANCE = 'distance',
}

export class UniversalSearchQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: SearchCategory, default: SearchCategory.ALL })
  @IsOptional()
  @IsEnum(SearchCategory)
  category?: SearchCategory = SearchCategory.ALL;

  @ApiPropertyOptional({ description: 'Danh sách ID chuyên khoa (phân cách bằng dấu phẩy)' })
  @IsOptional()
  @IsString()
  specialtyIds?: string;

  @ApiPropertyOptional({ description: 'Loại cơ sở (PUBLIC, PRIVATE, INTERNATIONAL, CLINIC)' })
  @IsOptional()
  @IsString()
  facilityType?: string;

  @ApiPropertyOptional({ description: 'Dịch vụ y tế (BOOKING, CHAT, VIDEO, TEST, VACCINE)' })
  @IsOptional()
  @IsString()
  services?: string;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Quận/Huyện' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Vĩ độ người dùng' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Kinh độ người dùng' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ enum: SearchSortBy, default: SearchSortBy.RELEVANCE })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sort?: SearchSortBy = SearchSortBy.RELEVANCE;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
