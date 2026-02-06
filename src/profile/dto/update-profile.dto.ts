import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Название мастерской должно быть строкой' })
  @MaxLength(100, {
    message: 'Название мастерской не должно превышать 100 символов',
  })
  @IsOptional()
  workshopName?: string;

  @IsString({ message: 'Телефон должен быть строкой' })
  @Matches(/^\+?[78][\d\s\-()]{9,}$/, {
    message: 'Некорректный формат телефона',
  })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Адрес должен быть строкой' })
  @MaxLength(200, { message: 'Адрес не должен превышать 200 символов' })
  @IsOptional()
  address?: string;
}
