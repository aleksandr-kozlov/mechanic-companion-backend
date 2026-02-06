import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email для восстановления пароля',
    example: 'mechanic@example.com',
  })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;
}
