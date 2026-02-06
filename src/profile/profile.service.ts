import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Получить профиль пользователя
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        workshopName: true,
        phone: true,
        address: true,
        logoUrl: true,
        signatureUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        workshopName: dto.workshopName,
        phone: dto.phone,
        address: dto.address,
      },
      select: {
        id: true,
        email: true,
        workshopName: true,
        phone: true,
        address: true,
        logoUrl: true,
        signatureUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated for user ${userId}`);
    return updatedUser;
  }

  /**
   * Сменить пароль
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверить старый пароль
    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Неверный старый пароль');
    }

    // Хешировать новый пароль
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Обновить пароль и инвалидировать все refresh tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId },
      }),
    ]);

    this.logger.log(`Password changed for user ${userId}`);
    return { success: true, message: 'Пароль успешно изменён' };
  }

  /**
   * Загрузить логотип
   */
  async uploadLogo(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Удалить старый логотип
    if (user.logoUrl) {
      await this.deleteFile(user.logoUrl);
    }

    // Создать директорию
    const uploadDir = path.join(process.cwd(), 'uploads', userId, 'logo');
    await fs.mkdir(uploadDir, { recursive: true });

    // Генерировать имя файла
    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Сжать и сохранить изображение (400x400)
    await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toFile(filepath);

    const logoUrl = `/api/files/${userId}/logo/${filename}`;

    // Обновить logoUrl в БД
    await this.prisma.user.update({
      where: { id: userId },
      data: { logoUrl },
    });

    this.logger.log(`Logo uploaded for user ${userId}`);
    return { logoUrl };
  }

  /**
   * Загрузить подпись
   */
  async uploadSignature(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Удалить старую подпись
    if (user.signatureUrl) {
      await this.deleteFile(user.signatureUrl);
    }

    // Создать директорию
    const uploadDir = path.join(process.cwd(), 'uploads', userId, 'signature');
    await fs.mkdir(uploadDir, { recursive: true });

    // Генерировать имя файла
    const filename = `${uuidv4()}.png`;
    const filepath = path.join(uploadDir, filename);

    // Сжать и сохранить изображение с прозрачностью (300x100)
    await sharp(file.buffer)
      .resize(300, 100, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toFile(filepath);

    const signatureUrl = `/api/files/${userId}/signature/${filename}`;

    // Обновить signatureUrl в БД
    await this.prisma.user.update({
      where: { id: userId },
      data: { signatureUrl },
    });

    this.logger.log(`Signature uploaded for user ${userId}`);
    return { signatureUrl };
  }

  /**
   * Удалить файл из файловой системы
   */
  private async deleteFile(fileUrl: string) {
    try {
      if (fileUrl.startsWith('/api/files/')) {
        const relativePath = fileUrl.replace('/api/files/', '');
        const absolutePath = path.join(process.cwd(), 'uploads', relativePath);
        await fs.unlink(absolutePath);
        this.logger.log(`Deleted file: ${relativePath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file ${fileUrl}: ${error.message}`);
    }
  }
}
