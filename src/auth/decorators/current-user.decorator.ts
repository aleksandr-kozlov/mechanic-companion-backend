import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  workshopName?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  signatureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Если указан конкретный ключ, возвращаем значение этого поля
    if (data) {
      return user?.[data];
    }

    // Иначе возвращаем весь объект пользователя
    return user;
  },
);
