import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'MechanicCompanion Backend API is running!';
  }
}
