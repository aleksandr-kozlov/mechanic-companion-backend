import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, workshopName } = registerDto;

    // Проверка существования пользователя
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        workshopName,
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

    // Генерация токенов
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);

    return {
      user,
      token: accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Поиск пользователя
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерация токенов
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);

    // Возврат данных без пароля
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    // Проверка существования refresh token в БД
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Неверный refresh token');
    }

    // Проверка срока действия
    if (tokenRecord.expiresAt < new Date()) {
      // Удаление истекшего токена
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token истёк');
    }

    // Верификация JWT
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Невалидный refresh token');
    }

    // Генерация новых токенов
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
    );

    // Удаление старого refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    // Поиск пользователя
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Возвращаем успех даже если пользователь не найден (безопасность)
      return {
        success: true,
        message: 'Если пользователь с таким email существует, на него отправлено письмо',
      };
    }

    // Генерация токена сброса пароля
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Токен действителен 1 час

    // Сохранение токена в БД
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Отправка email с токеном
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      success: true,
      message: 'Если пользователь с таким email существует, на него отправлено письмо',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Поиск токена в БД
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Неверный или истёкший токен');
    }

    // Проверка срока действия
    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Токен истёк');
    }

    // Проверка что токен не использован
    if (resetToken.used) {
      throw new BadRequestException('Токен уже использован');
    }

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновление пароля
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Отметка токена как использованного
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Удаление всех refresh токенов пользователя для безопасности
    await this.prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return {
      success: true,
      message: 'Пароль успешно изменён',
    };
  }

  async getMe(userId: string) {
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

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    // Access Token
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
    });

    // Refresh Token
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
    });

    // Сохранение refresh token в БД
    const expiresAt = new Date();
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
