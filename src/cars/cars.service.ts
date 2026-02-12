import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarsDto, CarSortBy } from './dto/query-cars.dto';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить список автомобилей пользователя
   */
  async findAll(userId: string, query: QueryCarsDto) {
    const { search, sortBy } = query;

    const where: any = { userId };

    // Поиск по госномеру, марке, модели, владельцу
    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Сортировка
    const orderBy: any =
      sortBy === CarSortBy.BRAND
        ? [{ brand: 'asc' }, { model: 'asc' }]
        : { createdAt: 'desc' };

    const cars = await this.prisma.car.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            visits: true,
          },
        },
      },
    });

    return cars;
  }

  /**
   * Получить автомобиль по ID
   */
  async findOne(id: string, userId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        visits: {
          select: {
            id: true,
            visitDate: true,
            workType: true,
            status: true,
            finalCost: true,
          },
          orderBy: { visitDate: 'desc' },
          take: 10, // Последние 10 визитов
        },
      },
    });

    if (!car) {
      throw new NotFoundException('Автомобиль не найден');
    }

    if (car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return car;
  }

  /**
   * Создать автомобиль
   */
  async create(userId: string, dto: CreateCarDto) {
    // Проверка уникальности госномера в рамках пользователя
    const existingCar = await this.prisma.car.findFirst({
      where: {
        userId,
        licensePlate: dto.licensePlate,
      },
    });

    if (existingCar) {
      throw new ConflictException(
        `Автомобиль с госномером ${dto.licensePlate} уже существует`,
      );
    }

    const car = await this.prisma.car.create({
      data: {
        userId,
        ...dto,
        visitsCount: 0,
      },
    });

    return car;
  }

  /**
   * Обновить автомобиль
   */
  async update(id: string, userId: string, dto: UpdateCarDto) {
    const car = await this.findOne(id, userId);

    // Если меняется госномер, проверить уникальность
    if (dto.licensePlate !== undefined && dto.licensePlate !== car.licensePlate) {
      const existingCar = await this.prisma.car.findUnique({
        where: {
          userId_licensePlate: {
            userId,
            licensePlate: dto.licensePlate,
          },
        },
      });

      if (existingCar) {
        throw new ConflictException(
          `Автомобиль с госномером ${dto.licensePlate} уже существует`,
        );
      }
    }

    const updatedCar = await this.prisma.car.update({
      where: { id },
      data: dto,
    });

    return updatedCar;
  }

  /**
   * Удалить автомобиль
   */
  async remove(id: string, userId: string) {
    const car = await this.findOne(id, userId);

    // Получить все файлы для удаления (только документы визитов)
    const visitDocuments = await this.prisma.visitDocument.findMany({
      where: { visit: { carId: id } },
    });

    // Удалить запись из БД (каскадное удаление сработает автоматически)
    await this.prisma.car.delete({
      where: { id },
    });

    // Физически удалить файлы
    const allFiles = visitDocuments.map((d) => d.fileUrl).filter(Boolean);

    await this.deleteFiles(allFiles);

    return { success: true, message: 'Автомобиль успешно удален' };
  }

  /**
   * Утилита для физического удаления файлов
   */
  private async deleteFiles(urls: string[]) {
    for (const url of urls) {
      if (!url) continue;

      try {
        // Преобразовать URL в путь к файлу
        // /api/files/userId/type/filename -> uploads/userId/type/filename
        const relativePath = url.replace('/api/files/', '');
        const filepath = path.join(process.cwd(), 'uploads', relativePath);

        await fs.unlink(filepath);
      } catch (error) {
        // Игнорировать ошибки удаления файлов (файл может уже не существовать)
        console.error(`Ошибка при удалении файла ${url}:`, error.message);
      }
    }
  }
}
