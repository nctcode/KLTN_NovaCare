import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { UniversalSearchQueryDto } from './dto/universal-search.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Public()
@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcare Universal Search (Bác sĩ, Bệnh viện, Phòng khám, Chuyên khoa, Dịch vụ)' })
  @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm đa năng kèm tính khoảng cách Haversine' })
  async search(@Query() query: UniversalSearchQueryDto) {
    const data = await this.searchService.search(query);
    return {
      success: true,
      data,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy danh sách chuyên khoa và cơ sở y tế phổ biến' })
  @ApiResponse({ status: 200, description: 'Danh sách gợi ý phổ biến' })
  async getPopular() {
    const data = await this.searchService.getPopular();
    return {
      success: true,
      data,
    };
  }

  @Get('locations')
  @ApiOperation({ summary: 'Lấy danh mục địa giới hành chính (Tỉnh/Thành, Quận/Huyện) cho bộ lọc khu vực' })
  @ApiResponse({ status: 200, description: 'Danh mục vị trí phân cấp' })
  async getLocations() {
    const data = await this.searchService.getLocations();
    return {
      success: true,
      data,
    };
  }
}
