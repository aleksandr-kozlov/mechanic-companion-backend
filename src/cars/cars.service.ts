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
        photos: {
          select: {
            id: true,
            photoUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            visits: true,
            documents: true,
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
        photos: {
          select: {
            id: true,
            photoUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          select: {
            id: true,
            documentName: true,
            documentUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
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
      include: {
        photos: true,
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
      include: {
        photos: true,
        documents: true,
      },
    });

    return updatedCar;
  }

  /**
   * Удалить автомобиль
   */
  async remove(id: string, userId: string) {
    const car = await this.findOne(id, userId);

    // Получить все файлы для удаления
    const photos = await this.prisma.carPhoto.findMany({
      where: { carId: id },
    });

    const documents = await this.prisma.carDocument.findMany({
      where: { carId: id },
    });

    const visitPhotos = await this.prisma.visitPhoto.findMany({
      where: { visit: { carId: id } },
    });

    const visitDocuments = await this.prisma.visitDocument.findMany({
      where: { visit: { carId: id } },
    });

    // Удалить запись из БД (каскадное удаление сработает автоматически)
    await this.prisma.car.delete({
      where: { id },
    });

    // Физически удалить файлы
    const allFiles = [
      ...photos.map((p) => p.photoUrl),
      ...documents.map((d) => d.documentUrl),
      ...visitPhotos.map((p) => p.photoUrl),
      ...visitDocuments.map((d) => d.documentUrl),
      car.mainPhotoUrl,
    ].filter(Boolean);

    await this.deleteFiles(allFiles);

    return { success: true, message: 'Автомобиль успешно удален' };
  }

  /**
   * Загрузить фото автомобиля (до 3 штук)
   */
  async uploadPhotos(
    id: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const car = await this.findOne(id, userId);

    // Проверка количества существующих фото
    const existingPhotosCount = await this.prisma.carPhoto.count({
      where: { carId: id },
    });

    if (existingPhotosCount + files.length > 3) {
      throw new BadRequestException(
        `Максимум 3 фото на автомобиль. Сейчас загружено ${existingPhotosCount}`,
      );
    }

    // Создать директорию для фото пользователя
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      userId,
      'car-photos',
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedPhotos = [];

    for (const file of files) {
      // Генерировать уникальное имя файла
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(uploadDir, filename);

      // Сжать и сохранить изображение
      await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(filepath);

      const photoUrl = `/api/files/${userId}/car-photos/${filename}`;

      // Сохранить в БД
      const photo = await this.prisma.carPhoto.create({
        data: {
          carId: id,
          photoUrl,
        },
      });

      uploadedPhotos.push(photo);

      // Если это первое фото, установить как главное
      if (!car.mainPhotoUrl && uploadedPhotos.length === 1) {
        await this.prisma.car.update({
          where: { id },
          data: { mainPhotoUrl: photoUrl },
        });
      }
    }

    return uploadedPhotos;
  }

  /**
   * Удалить фото автомобиля
   */
  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.prisma.carPhoto.findUnique({
      where: { id: photoId },
      include: { car: true },
    });

    if (!photo) {
      throw new NotFoundException('Фото не найдено');
    }

    if (photo.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    // Удалить из БД
    await this.prisma.carPhoto.delete({
      where: { id: photoId },
    });

    // Если это было главное фото, установить новое
    if (photo.car.mainPhotoUrl === photo.photoUrl) {
      const remainingPhoto = await this.prisma.carPhoto.findFirst({
        where: { carId: photo.carId },
        orderBy: { createdAt: 'asc' },
      });

      await this.prisma.car.update({
        where: { id: photo.carId },
        data: {
          mainPhotoUrl: remainingPhoto?.photoUrl || null,
        },
      });
    }

    // Физически удалить файл
    await this.deleteFiles([photo.photoUrl]);

    return { success: true, message: 'Фото успешно удалено' };
  }

  /**
   * Получить документы автомобиля
   */
  async getDocuments(carId: string, userId: string) {
    await this.findOne(carId, userId); // Проверка прав доступа

    const documents = await this.prisma.carDocument.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  /**
   * Загрузить документ автомобиля
   */
  async uploadDocument(
    carId: string,
    userId: string,
    file: Express.Multer.File,
    documentName: string,
  ) {
    await this.findOne(carId, userId); // Проверка прав доступа

    // Создать директорию
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      userId,
      'car-documents',
    );
    await fs.mkdir(uploadDir, { recursive: true });

    // Сохранить файл
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const documentUrl = `/api/files/${userId}/car-documents/${filename}`;

    // Сохранить в БД
    const document = await this.prisma.carDocument.create({
      data: {
        carId,
        documentName: documentName || file.originalname,
        documentUrl,
      },
    });

    return document;
  }

  /**
   * Удалить документ
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.prisma.carDocument.findUnique({
      where: { id: documentId },
      include: { car: true },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    if (document.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    // Удалить из БД
    await this.prisma.carDocument.delete({
      where: { id: documentId },
    });

    // Физически удалить файл
    await this.deleteFiles([document.documentUrl]);

    return { success: true, message: 'Документ успешно удален' };
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
