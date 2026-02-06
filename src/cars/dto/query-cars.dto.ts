import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum CarSortBy {
  DATE = 'date',
  BRAND = 'brand',
}

export class QueryCarsDto {
  @IsOptional()
  @IsString({ message: 'Поисковый запрос должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsEnum(CarSortBy, { message: 'Сортировка может быть только date или brand' })
  sortBy?: CarSortBy = CarSortBy.DATE;
}
