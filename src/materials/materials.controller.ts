import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Materials')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  /**
   * GET /api/visits/:visitId/materials - Получить материалы визита
   */
  @Get('visits/:visitId/materials')
  async findAll(
    @Param('visitId') visitId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.materialsService.findAll(visitId, userId);
  }

  /**
   * POST /api/visits/:visitId/materials - Добавить материал
   */
  @Post('visits/:visitId/materials')
  async create(
    @Param('visitId') visitId: string,
    @CurrentUser('id') userId: string,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    return this.materialsService.create(visitId, userId, createMaterialDto);
  }

  /**
   * PUT /api/materials/:id - Обновить материал
   */
  @Put('materials/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, userId, updateMaterialDto);
  }

  /**
   * DELETE /api/materials/:id - Удалить материал
   */
  @Delete('materials/:id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.materialsService.remove(id, userId);
  }
}
