import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { VisitStatus } from './create-visit.dto';

export class QueryVisitsDto {
  @IsOptional()
  @IsString({ message: 'ID автомобиля должен быть строкой' })
  carId?: string;

  @IsOptional()
  @IsEnum(VisitStatus, { message: 'Неверный статус визита' })
  status?: VisitStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Дата начала должна быть в формате ISO 8601' })
  dateFrom?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Дата окончания должна быть в формате ISO 8601' },
  )
  dateTo?: string;
}
