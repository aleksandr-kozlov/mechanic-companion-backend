import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendReportDto {
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;
}
