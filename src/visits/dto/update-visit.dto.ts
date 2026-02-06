import { PartialType } from '@nestjs/mapped-types';
import { CreateVisitDto } from './create-visit.dto';
import { OmitType } from '@nestjs/mapped-types';

// Исключаем carId из обновления - автомобиль не должен меняться
export class UpdateVisitDto extends PartialType(
  OmitType(CreateVisitDto, ['carId'] as const),
) {}
