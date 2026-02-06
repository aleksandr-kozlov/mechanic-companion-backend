import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Название материала или запчасти',
    example: 'Масло моторное 5W-30',
  })
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название материала обязательно' })
  name: string;

  @ApiProperty({
    description: 'Количество (в штуках, литрах и т.д.)',
    example: 5,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Количество должно быть числом' })
  @Min(0.01, { message: 'Количество должно быть больше 0' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Цена за единицу в рублях',
    example: 1200.50,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  @Type(() => Number)
  price: number;
}
