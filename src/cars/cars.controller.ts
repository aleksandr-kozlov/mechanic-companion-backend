import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarsDto } from './dto/query-cars.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  /**
   * GET /api/cars - Получить список автомобилей
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryCarsDto) {
    return this.carsService.findAll(userId, query);
  }

  /**
   * POST /api/cars - Создать автомобиль
   */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createCarDto: CreateCarDto,
  ) {
    return this.carsService.create(userId, createCarDto);
  }

  /**
   * GET /api/cars/:id - Получить автомобиль по ID
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.carsService.findOne(id, userId);
  }

  /**
   * PUT /api/cars/:id - Обновить автомобиль
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, userId, updateCarDto);
  }

  /**
   * DELETE /api/cars/:id - Удалить автомобиль
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.carsService.remove(id, userId);
  }

  /**
   * POST /api/cars/:id/photos - Загрузить фото (до 3 штук)
   */
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', 3, {
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
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не загружены');
    }

    return this.carsService.uploadPhotos(id, userId, files);
  }

  /**
   * DELETE /api/cars/photos/:photoId - Удалить фото
   */
  @Delete('photos/:photoId')
  async deletePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.carsService.deletePhoto(photoId, userId);
  }

  /**
   * GET /api/cars/:carId/documents - Получить документы автомобиля
   */
  @Get(':carId/documents')
  async getDocuments(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.carsService.getDocuments(carId, userId);
  }

  /**
   * POST /api/cars/:carId/documents - Загрузить документ
   */
  @Post(':carId/documents')
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
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentName') documentName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.carsService.uploadDocument(carId, userId, file, documentName);
  }

  /**
   * DELETE /api/documents/:id - Удалить документ
   */
  @Delete('documents/:id')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.carsService.deleteDocument(id, userId);
  }
}
