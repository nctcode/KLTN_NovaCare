import {
  Controller,
  Post,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { CatalogSyncService } from './catalog-sync.service';

export class SyncCatalogRequestDto {
  endpointUrl?: string;
}

@ApiTags('Liên thông y tế - Đồng bộ Danh mục HIS (Hospital Catalog Ingestion)')
@Controller('api/v1/integration/catalog-sync')
export class CatalogSyncController {
  constructor(private readonly syncService: CatalogSyncService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Đồng bộ danh mục Bệnh viện & Bác sĩ từ hệ thống HIS ngoài',
    description:
      'Gọi API Mock HIS (mặc định port 4000), chuẩn hóa dữ liệu, mapping chuyên khoa và lưu vào database theo cơ chế Idempotent Upsert (Created / Updated / Unchanged).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        endpointUrl: {
          type: 'string',
          example: 'http://localhost:4000/api/hospital-catalog',
          description: 'URL của API Mock HIS bên ngoài',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Đồng bộ danh mục từ HIS thành công',
  })
  async triggerSync(@Body() body: SyncCatalogRequestDto) {
    const data = await this.syncService.syncCatalog(body?.endpointUrl);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đồng bộ dữ liệu cơ sở y tế từ HIS thành công',
      data,
    };
  }
}
