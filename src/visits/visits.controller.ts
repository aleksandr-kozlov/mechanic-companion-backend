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
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
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
import { SendReportDto } from './dto/send-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PdfService } from '../pdf/pdf.service';
import { MailService } from '../mail/mail.service';

@ApiTags('Visits')
@ApiBearerAuth('JWT-auth')
@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}

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

  /**
   * GET /api/visits/:id/export-pdf - Экспортировать отчёт о визите в PDF
   */
  @Get(':id/export-pdf')
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // Получить полные данные визита
    const visit = await this.visitsService.findOne(id, userId);

    // Генерировать PDF
    const pdfBuffer = await this.pdfService.generateVisitReportPDF(
      visit,
      user,
    );

    // Установить заголовки для скачивания файла
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="visit-report-${id.substring(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * POST /api/visits/:id/send-report - Отправить отчёт о визите на email
   */
  @Post(':id/send-report')
  @HttpCode(HttpStatus.OK)
  async sendReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: any,
    @Body() sendReportDto: SendReportDto,
  ) {
    // Получить полные данные визита
    const visit = await this.visitsService.findOne(id, userId);

    // Генерировать PDF
    const pdfBuffer = await this.pdfService.generateVisitReportPDF(
      visit,
      user,
    );

    // Отправить email с PDF
    await this.mailService.sendVisitReportEmail(
      sendReportDto.email,
      visit,
      pdfBuffer,
    );

    return {
      success: true,
      message: `Отчёт успешно отправлен на ${sendReportDto.email}`,
    };
  }
}
