import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Visits')
@ApiBearerAuth('JWT-auth')
@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * GET /api/visits - Получить все визиты пользователя
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryVisitsDto,
  ) {
    return this.visitsService.findAll(userId, query);
  }

  /**
   * POST /api/visits - Создать визит
   */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createVisitDto: CreateVisitDto,
  ) {
    return this.visitsService.create(userId, createVisitDto);
  }

  /**
   * GET /api/visits/:id - Получить визит по ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.visitsService.findOne(id, userId);
  }

  /**
   * PUT /api/visits/:id - Обновить визит
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateVisitDto: UpdateVisitDto,
  ) {
    return this.visitsService.update(id, userId, updateVisitDto);
  }

  /**
   * DELETE /api/visits/:id - Удалить визит
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.visitsService.remove(id, userId);
  }

  /**
   * PATCH /api/visits/:id/status - Изменить статус визита
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.visitsService.updateStatus(id, userId, updateStatusDto);
  }

  /**
   * GET /api/visits/:visitId/documents - Получить документы визита
   */
  @Get(':visitId/documents')
  async getDocuments(
    @Param('visitId') visitId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.getDocuments(visitId, userId);
  }

  /**
   * POST /api/visits/:id/documents - Загрузить документ визита (изображение или файл)
   */
  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          // Изображения
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/heic',
          'image/heif',
          // Документы
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Поддерживаются только изображения (JPEG, PNG, HEIC) и документы (PDF, DOC, DOCX)',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить документ или изображение для визита' })
  async uploadDocument(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.visitsService.uploadDocument(visitId, userId, file);
  }

  /**
   * DELETE /api/visits/:id/documents/:documentId - Удалить документ визита
   */
  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Удалить документ визита' })
  async deleteDocument(
    @Param('id') visitId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.deleteDocument(documentId, userId);
  }

}
