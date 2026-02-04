import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Если ответ уже содержит структуру с success и message, используем её
        if (data && typeof data === 'object' && 'success' in data) {
          return data as Response<T>;
        }

        // Если это простой объект с message, извлекаем message
        if (data && typeof data === 'object' && 'message' in data) {
          const { message, ...rest } = data;
          return {
            success: true,
            data: rest as T,
            message: message as string,
          };
        }

        // Стандартная обёртка для всех остальных ответов
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
