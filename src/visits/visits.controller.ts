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
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { SendReportDto } from './dto/send-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PhotoType } from '@prisma/client';
import { PdfService } from '../pdf/pdf.service';
import { MailService } from '../mail/mail.service';

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
   * POST /api/visits/:id/photos - Загрузить фото визита
   * Body: photoType=before|after, photos (files)
   */
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
          return callback(
            new BadRequestException('Поддерживаются только JPG и PNG'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadPhotos(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('photoType') photoType: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не загружены');
    }

    if (!photoType || !['BEFORE', 'AFTER'].includes(photoType.toUpperCase())) {
      throw new BadRequestException(
        'Тип фото должен быть BEFORE или AFTER',
      );
    }

    return this.visitsService.uploadPhotos(
      id,
      userId,
      files,
      photoType.toUpperCase() as PhotoType,
    );
  }

  /**
   * DELETE /api/visits/photos/:photoId - Удалить фото визита
   */
  @Delete('photos/:photoId')
  async deletePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.deletePhoto(photoId, userId);
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
   * POST /api/visits/:visitId/documents - Загрузить документ визита
   */
  @Post(':visitId/documents')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Поддерживаются только PDF, DOC, DOCX'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(
    @Param('visitId') visitId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentName') documentName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.visitsService.uploadDocument(
      visitId,
      userId,
      file,
      documentName,
    );
  }

  /**
   * DELETE /api/visits/documents/:id - Удалить документ визита
   */
  @Delete('documents/:id')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.deleteDocument(id, userId);
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
