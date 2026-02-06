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

export class CreateCarDto {
  @IsString({ message: 'Госномер должен быть строкой' })
  @IsNotEmpty({ message: 'Госномер обязателен' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  licensePlate: string;

  @IsString({ message: 'Марка должна быть строкой' })
  @IsNotEmpty({ message: 'Марка обязательна' })
  @Transform(({ value }) => value?.trim())
  brand: string;

  @IsString({ message: 'Модель должна быть строкой' })
  @IsNotEmpty({ message: 'Модель обязательна' })
  @Transform(({ value }) => value?.trim())
  model: string;

  @IsOptional()
  @IsInt({ message: 'Год должен быть целым числом' })
  @Min(1900, { message: 'Год должен быть не меньше 1900' })
  @Max(new Date().getFullYear() + 1, {
    message: 'Год не может быть больше текущего',
  })
  year?: number;

  @IsOptional()
  @IsString({ message: 'VIN должен быть строкой' })
  @Length(17, 17, { message: 'VIN должен содержать ровно 17 символов' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: 'VIN должен содержать только латинские буквы (кроме I, O, Q) и цифры',
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  vin?: string;

  @IsString({ message: 'Имя владельца должно быть строкой' })
  @IsNotEmpty({ message: 'Имя владельца обязательно' })
  @Transform(({ value }) => value?.trim())
  ownerName: string;

  @IsString({ message: 'Телефон владельца должен быть строкой' })
  @IsNotEmpty({ message: 'Телефон владельца обязателен' })
  @Matches(/^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/, {
    message: 'Неверный формат телефона',
  })
  @Transform(({ value }) => value?.trim())
  ownerPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Неверный формат email' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  ownerEmail?: string;

  @IsOptional()
  @IsString({ message: 'Заметки должны быть строкой' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
