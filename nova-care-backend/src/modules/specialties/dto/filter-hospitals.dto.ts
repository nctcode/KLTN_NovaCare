import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';

export class FilterHospitalsBySpecialtyDto {
  @ApiPropertyOptional({ description: 'Vĩ độ vị trí bệnh nhân (latitude)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Kinh độ vị trí bệnh nhân (longitude)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Khoảng cách tối đa (km): 2, 5, 10' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Lọc ngày: today, tomorrow, weekend, hoặc YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Lọc buổi: morning, afternoon, evening' })
  @IsOptional()
  @IsString()
  timeOfDay?: string;

  @ApiPropertyOptional({ description: 'Mức giá từ' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Mức giá đến' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Chỉ hiển thị nơi còn lịch' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Sắp xếp: relevant (phù hợp nhất), earliest (sớm nhất), nearest (gần nhất), rating (rating cao), price (giá thấp)' })
  @IsOptional()
  @IsString()
  sort?: string;
}
