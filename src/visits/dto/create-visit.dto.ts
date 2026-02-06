import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum WorkType {
  DETAILING = 'DETAILING',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  DIAGNOSTICS = 'DIAGNOSTICS',
  TIRE_SERVICE = 'TIRE_SERVICE',
  OTHER = 'OTHER',
}

export enum VisitStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class CreateVisitDto {
  @IsString({ message: 'ID автомобиля должен быть строкой' })
  @IsNotEmpty({ message: 'ID автомобиля обязателен' })
  carId: string;

  @IsDateString({}, { message: 'Дата визита должна быть в формате ISO 8601' })
  @IsNotEmpty({ message: 'Дата визита обязательна' })
  visitDate: string;

  @IsEnum(WorkType, { message: 'Неверный тип работ' })
  @IsNotEmpty({ message: 'Тип работ обязателен' })
  workType: WorkType;

  @IsString({ message: 'Описание работ должно быть строкой' })
  @IsNotEmpty({ message: 'Описание работ обязательно' })
  @Transform(({ value }) => value?.trim())
  workDescription: string;

  @IsOptional()
  @IsNumber({}, { message: 'Планируемая стоимость должна быть числом' })
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  @Type(() => Number)
  estimatedCost?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Итоговая стоимость должна быть числом' })
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  @Type(() => Number)
  finalCost?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Дата завершения должна быть в формате ISO 8601' },
  )
  estimatedCompletionDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Уровень топлива должен быть числом' })
  @Min(0, { message: 'Уровень топлива не может быть меньше 0' })
  @Max(100, { message: 'Уровень топлива не может быть больше 100' })
  @Type(() => Number)
  fuelLevel?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Пробег должен быть числом' })
  @Min(0, { message: 'Пробег не может быть отрицательным' })
  @Type(() => Number)
  mileage?: number;

  @IsOptional()
  @IsBoolean({ message: 'Наличие повреждений должно быть булевым значением' })
  @Type(() => Boolean)
  hasDamages?: boolean;

  @IsOptional()
  @IsString({ message: 'Описание повреждений должно быть строкой' })
  @Transform(({ value }) => value?.trim())
  damagesDescription?: string;

  @IsOptional()
  @IsString({ message: 'Личные вещи должны быть строкой' })
  @Transform(({ value }) => value?.trim())
  personalItems?: string;

  @IsOptional()
  @IsString({ message: 'Состояние шин должно быть строкой' })
  @Transform(({ value }) => value?.trim())
  tireCondition?: string;
}
