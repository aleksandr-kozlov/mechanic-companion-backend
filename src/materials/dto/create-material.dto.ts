import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название материала обязательно' })
  name: string;

  @IsNumber({}, { message: 'Количество должно быть числом' })
  @Min(0.01, { message: 'Количество должно быть больше 0' })
  @Type(() => Number)
  quantity: number;

  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  @Type(() => Number)
  price: number;
}
