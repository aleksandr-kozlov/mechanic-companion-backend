import { IsEnum, IsNotEmpty } from 'class-validator';
import { VisitStatus } from './create-visit.dto';

export class UpdateStatusDto {
  @IsEnum(VisitStatus, { message: 'Неверный статус визита' })
  @IsNotEmpty({ message: 'Статус обязателен' })
  status: VisitStatus;
}
