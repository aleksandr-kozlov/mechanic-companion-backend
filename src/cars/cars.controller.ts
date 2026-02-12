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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { VisitsService } from '../visits/visits.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarsDto } from './dto/query-cars.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cars')
@ApiBearerAuth('JWT-auth')
@Controller('cars')
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly visitsService: VisitsService,
  ) {}

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
   * GET /api/cars/:carId/visits - Получить визиты конкретного автомобиля
   */
  @Get(':carId/visits')
  async getVisits(
    @Param('carId') carId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.findByCarId(carId, userId);
  }
}
