import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Название мастерской',
    example: 'Автосервис "Быстрый Ремонт"',
    maxLength: 100,
  })
  @IsString({ message: 'Название мастерской должно быть строкой' })
  @MaxLength(100, {
    message: 'Название мастерской не должно превышать 100 символов',
  })
  @IsOptional()
  workshopName?: string;

  @ApiPropertyOptional({
    description: 'Телефон (российский формат)',
    example: '+79991234567',
  })
  @IsString({ message: 'Телефон должен быть строкой' })
  @Matches(/^\+?[78][\d\s\-()]{9,}$/, {
    message: 'Некорректный формат телефона',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Адрес мастерской',
    example: 'г. Москва, ул. Ленина, д. 10',
    maxLength: 200,
  })
  @IsString({ message: 'Адрес должен быть строкой' })
  @MaxLength(200, { message: 'Адрес не должен превышать 200 символов' })
  @IsOptional()
  address?: string;
}
