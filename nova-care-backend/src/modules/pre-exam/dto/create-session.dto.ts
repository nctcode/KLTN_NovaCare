import { IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePreExamSessionDto {
  @ApiPropertyOptional({ description: 'Mô tả triệu chứng ban đầu bằng văn bản' })
  @IsOptional()
  @IsString()
  initialText?: string;

  @ApiPropertyOptional({ description: 'Bản ghi giọng nói (nếu có)' })
  @IsOptional()
  @IsString()
  voiceTranscript?: string;

  @ApiPropertyOptional({ description: 'Dữ liệu sơ đồ cơ thể (tọa độ vị trí đau)' })
  @IsOptional()
  @IsObject()
  bodyDiagramData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Danh sách URL tài liệu đã upload (xét nghiệm, đơn thuốc)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  uploadedFiles?: string[];
}
