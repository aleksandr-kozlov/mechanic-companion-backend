import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль',
    example: 'OldPassword123',
  })
  @IsString({ message: 'Старый пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Старый пароль обязателен' })
  oldPassword: string;

  @ApiProperty({
    description: 'Новый пароль (минимум 8 символов)',
    example: 'NewSecurePassword456',
    minLength: 8,
  })
  @IsString({ message: 'Новый пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @MinLength(8, { message: 'Новый пароль должен содержать минимум 8 символов' })
  newPassword: string;
}
