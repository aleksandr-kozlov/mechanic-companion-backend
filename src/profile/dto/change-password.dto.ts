import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Старый пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Старый пароль обязателен' })
  oldPassword: string;

  @IsString({ message: 'Новый пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @MinLength(8, { message: 'Новый пароль должен содержать минимум 8 символов' })
  newPassword: string;
}
