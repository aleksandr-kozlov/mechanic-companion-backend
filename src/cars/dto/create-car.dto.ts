import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarDto {
  @ApiProperty({
    description: 'Государственный номер автомобиля',
    example: 'А123БВ777',
  })
  @IsString({ message: 'Госномер должен быть строкой' })
  @IsNotEmpty({ message: 'Госномер обязателен' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  licensePlate: string;

  @ApiProperty({
    description: 'Марка автомобиля',
    example: 'Toyota',
  })
  @IsString({ message: 'Марка должна быть строкой' })
  @IsNotEmpty({ message: 'Марка обязательна' })
  @Transform(({ value }) => value?.trim())
  brand: string;

  @ApiProperty({
    description: 'Модель автомобиля',
    example: 'Camry',
  })
  @IsString({ message: 'Модель должна быть строкой' })
  @IsNotEmpty({ message: 'Модель обязательна' })
  @Transform(({ value }) => value?.trim())
  model: string;

  @ApiPropertyOptional({
    description: 'Год выпуска',
    example: 2020,
    minimum: 1900,
  })
  @IsOptional()
  @IsInt({ message: 'Год должен быть целым числом' })
  @Min(1900, { message: 'Год должен быть не меньше 1900' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Год не может быть больше текущего',
  })
  year?: number;

  @ApiPropertyOptional({
    description: 'VIN номер (17 символов)',
    example: '1HGBH41JXMN109186',
    minLength: 17,
    maxLength: 17,
  })
  @IsOptional()
  @IsString({ message: 'VIN должен быть строкой' })
  @Length(17, 17, { message: 'VIN должен содержать ровно 17 символов' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: 'VIN должен содержать только латинские буквы (кроме I, O, Q) и цифры',
  })
  @Transform(({ value }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim().toUpperCase();
  })
  vin?: string;

  @ApiProperty({
    description: 'Имя владельца автомобиля',
    example: 'Иванов Иван Иванович',
  })
  @IsString({ message: 'Имя владельца должно быть строкой' })
  @IsNotEmpty({ message: 'Имя владельца обязательно' })
  @Transform(({ value }) => value?.trim())
  ownerName: string;

  @ApiProperty({
    description: 'Телефон владельца (российский формат)',
    example: '+79991234567',
  })
  @IsString({ message: 'Телефон владельца должен быть строкой' })
  @IsNotEmpty({ message: 'Телефон владельца обязателен' })
  @Matches(/^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/, {
    message: 'Неверный формат телефона',
  })
  @Transform(({ value }) => value?.trim())
  ownerPhone: string;

  @ApiPropertyOptional({
    description: 'Email владельца',
    example: 'owner@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Неверный формат email' })
  @Transform(({ value }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim().toLowerCase();
  })
  ownerEmail?: string;

  @ApiPropertyOptional({
    description: 'Заметки о автомобиле',
    example: 'Нужна замена масла каждые 10000 км',
  })
  @IsOptional()
  @IsString({ message: 'Заметки должны быть строкой' })
  @Transform(({ value }) => {
    if (!value || value.trim() === '') return undefined;
    return value.trim();
  })
  notes?: string;
}
