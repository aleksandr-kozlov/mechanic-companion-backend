import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить список материалов визита
   */
  async findAll(visitId: string, userId: string) {
    // Проверить права доступа к визиту
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { car: true },
    });

    if (!visit) {
      throw new NotFoundException('Визит не найден');
    }

    if (visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const materials = await this.prisma.visitMaterial.findMany({
      where: { visitId },
      orderBy: { createdAt: 'asc' },
    });

    return materials;
  }

  /**
   * Создать материал
   */
  async create(visitId: string, userId: string, dto: CreateMaterialDto) {
    // Проверить права доступа к визиту
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { car: true },
    });

    if (!visit) {
      throw new NotFoundException('Визит не найден');
    }

    if (visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const material = await this.prisma.visitMaterial.create({
      data: {
        visitId,
        name: dto.name,
        quantity: dto.quantity,
        price: dto.price,
      },
    });

    return material;
  }

  /**
   * Обновить материал
   */
  async update(id: string, userId: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.visitMaterial.findUnique({
      where: { id },
      include: {
        visit: {
          include: { car: true },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    if (material.visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const updatedMaterial = await this.prisma.visitMaterial.update({
      where: { id },
      data: dto,
    });

    return updatedMaterial;
  }

  /**
   * Удалить материал
   */
  async remove(id: string, userId: string) {
    const material = await this.prisma.visitMaterial.findUnique({
      where: { id },
      include: {
        visit: {
          include: { car: true },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    if (material.visit.car.userId !== userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    await this.prisma.visitMaterial.delete({
      where: { id },
    });

    return { success: true, message: 'Материал успешно удален' };
  }
}
