import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth('JWT-auth')
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /api/profile - Получить профиль текущего пользователя
   */
  @Get()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  /**
   * PUT /api/profile - Обновить профиль
   */
  @Put()
  @ApiOperation({ summary: 'Обновить профиль' })
  @ApiResponse({ status: 200, description: 'Профиль успешно обновлён' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  /**
   * PUT /api/profile/password - Сменить пароль
   */
  @Put('password')
  @ApiOperation({ summary: 'Сменить пароль' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменён' })
  @ApiResponse({ status: 400, description: 'Неверный старый пароль' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(userId, changePasswordDto);
  }

  /**
   * POST /api/profile/logo - Загрузить логотип мастерской
   */
  @Post('logo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить логотип мастерской' })
  @ApiResponse({ status: 200, description: 'Логотип успешно загружен' })
  @ApiResponse({ status: 400, description: 'Некорректный файл' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @UseInterceptors(
    FileInterceptor('logo', {
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
  async uploadLogo(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.profileService.uploadLogo(userId, file);
  }

  /**
   * POST /api/profile/signature - Загрузить подпись
   */
  @Post('signature')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить подпись (PNG с прозрачностью)' })
  @ApiResponse({ status: 200, description: 'Подпись успешно загружена' })
  @ApiResponse({ status: 400, description: 'Некорректный файл (только PNG)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @UseInterceptors(
    FileInterceptor('signature', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(png)$/)) {
          return callback(
            new BadRequestException('Поддерживается только PNG'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadSignature(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.profileService.uploadSignature(userId, file);
  }
}
