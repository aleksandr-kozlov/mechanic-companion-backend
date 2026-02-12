import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить список всех визитов пользователя с фильтрацией
   */
  async findAll(userId: string, query: QueryVisitsDto) {
    const { carId, status, dateFrom, dateTo } = query;

    const where: any = {
      car: {
        userId,
      },
    };

    if (carId) {
      where.carId = carId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) {
        where.visitDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.visitDate.lte = new Date(dateTo);
      }
    }

    const visits = await this.prisma.visit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      include: {
        car: {
          select: {
            id: true,
            licensePlate: true,
            brand: true,
            model: true,
            ownerName: true,
          },
        },
        materials: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
        _count: {
          select: {
            materials: true,
            documents: true,
          },
        },
      },
    });

    return visits;
  }

  /**
   * Получить визиты конкретного автомобиля
   */
  async findByCarId(carId: string, userId: string) {
    // Проверить что автомобиль принадлежит пользователю
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      throw new NotFoundException('Автомобиль не найден');
    }

    if (car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const visits = await this.prisma.visit.findMany({
      where: { carId },
      orderBy: { visitDate: 'desc' },
      include: {
        materials: true,
        _count: {
          select: {
            materials: true,
            documents: true,
          },
        },
      },
    });

    return visits;
  }

  /**
   * Получить визит по ID
   */
  async findOne(id: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        car: true,
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Визит не найден');
    }

    if (visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return visit;
  }

  /**
   * Создать визит
   */
  async create(userId: string, dto: CreateVisitDto) {
    // Проверить что автомобиль существует и принадлежит пользователю
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
    });

    if (!car) {
      throw new NotFoundException('Автомобиль не найден');
    }

    if (car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    // Создать визит и обновить счётчики автомобиля в транзакции
    const result = await this.prisma.$transaction(async (prisma) => {
      // Создать визит
      const visit = await prisma.visit.create({
        data: {
          carId: dto.carId,
          visitDate: new Date(dto.visitDate),
          workType: dto.workType,
          workDescription: dto.workDescription,
          estimatedCost: dto.estimatedCost,
          finalCost: dto.finalCost,
          estimatedCompletionDate: dto.estimatedCompletionDate
            ? new Date(dto.estimatedCompletionDate)
            : null,
          fuelLevel: dto.fuelLevel,
          mileage: dto.mileage,
          hasDamages: dto.hasDamages || false,
          damagesDescription: dto.damagesDescription,
          personalItems: dto.personalItems,
          tireCondition: dto.tireCondition,
          status: 'IN_PROGRESS',
        },
        include: {
          car: true,
        },
      });

      // Обновить счётчики автомобиля
      await prisma.car.update({
        where: { id: dto.carId },
        data: {
          visitsCount: { increment: 1 },
          lastVisitDate: new Date(dto.visitDate),
        },
      });

      return visit;
    });

    return result;
  }

  /**
   * Обновить визит
   */
  async update(id: string, userId: string, dto: UpdateVisitDto) {
    const visit = await this.findOne(id, userId);

    // Проверить изменилась ли дата визита
    const dateChanged =
      dto.visitDate !== undefined &&
      new Date(dto.visitDate).getTime() !==
        new Date(visit.visitDate).getTime();

    const updateData: any = {
      ...dto,
    };

    if (dto.visitDate) {
      updateData.visitDate = new Date(dto.visitDate);
    }

    if (dto.estimatedCompletionDate) {
      updateData.estimatedCompletionDate = new Date(
        dto.estimatedCompletionDate,
      );
    }

    const updatedVisit = await this.prisma.visit.update({
      where: { id },
      data: updateData,
      include: {
        car: true,
        materials: true,
        documents: true,
      },
    });

    // Если дата изменилась, пересчитать lastVisitDate автомобиля
    if (dateChanged) {
      await this.updateCarLastVisitDate(visit.carId);
    }

    return updatedVisit;
  }

  /**
   * Удалить визит
   */
  async remove(id: string, userId: string) {
    const visit = await this.findOne(id, userId);

    // Получить все файлы для удаления
    const documents = await this.prisma.visitDocument.findMany({
      where: { visitId: id },
    });

    // Удалить визит из БД (каскадное удаление материалов, документов)
    await this.prisma.$transaction(async (prisma) => {
      await prisma.visit.delete({
        where: { id },
      });

      // Обновить счётчик визитов
      await prisma.car.update({
        where: { id: visit.carId },
        data: {
          visitsCount: { decrement: 1 },
        },
      });
    });

    // Пересчитать lastVisitDate
    await this.updateCarLastVisitDate(visit.carId);

    // Физически удалить файлы
    const allFiles = documents.map((d) => d.fileUrl);

    await this.deleteFiles(allFiles);

    return { success: true, message: 'Визит успешно удален' };
  }

  /**
   * Изменить статус визита
   */
  async updateStatus(id: string, userId: string, dto: UpdateStatusDto) {
    const visit = await this.findOne(id, userId);

    const updatedVisit = await this.prisma.visit.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        car: true,
        materials: true,
      },
    });

    return updatedVisit;
  }

  /**
   * Получить документы визита
   */
  async getDocuments(visitId: string, userId: string) {
    await this.findOne(visitId, userId); // Проверка прав доступа

    const documents = await this.prisma.visitDocument.findMany({
      where: { visitId },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  /**
   * Загрузить документ визита (изображение, PDF, DOC, DOCX)
   */
  async uploadDocument(
    visitId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const visit = await this.findOne(visitId, userId);

    // Проверить количество существующих документов
    const existingCount = await this.prisma.visitDocument.count({
      where: { visitId },
    });

    if (existingCount >= 10) {
      throw new BadRequestException(
        'Максимум 10 документов на визит',
      );
    }

    // Создать директорию
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      visit.car.userId,
      'visit-documents',
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Если это изображение, сжать его
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(filepath);
    } else {
      // Сохранить как есть для документов
      await fs.writeFile(filepath, file.buffer);
    }

    const fileUrl = `/api/files/${visit.car.userId}/visit-documents/${filename}`;

    // Сохранить в БД
    const document = await this.prisma.visitDocument.create({
      data: {
        visitId,
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });

    return document;
  }

  /**
   * Удалить документ визита
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.prisma.visitDocument.findUnique({
      where: { id: documentId },
      include: {
        visit: {
          include: {
            car: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    if (document.visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    // Удалить из БД
    await this.prisma.visitDocument.delete({
      where: { id: documentId },
    });

    // Физически удалить файл
    await this.deleteFiles([document.fileUrl]);

    return { success: true, message: 'Документ успешно удален' };
  }

  /**
   * Обновить lastVisitDate автомобиля
   * (берёт дату последнего визита)
   */
  private async updateCarLastVisitDate(carId: string) {
    const lastVisit = await this.prisma.visit.findFirst({
      where: { carId },
      orderBy: { visitDate: 'desc' },
      select: { visitDate: true },
    });

    await this.prisma.car.update({
      where: { id: carId },
      data: {
        lastVisitDate: lastVisit ? lastVisit.visitDate : null,
      },
    });
  }

  /**
   * Утилита для физического удаления файлов
   */
  private async deleteFiles(urls: string[]) {
    for (const url of urls) {
      if (!url) continue;

      try {
        const relativePath = url.replace('/api/files/', '');
        const filepath = path.join(process.cwd(), 'uploads', relativePath);

        await fs.unlink(filepath);
      } catch (error) {
        console.error(`Ошибка при удалении файла ${url}:`, error.message);
      }
    }
  }
}
