import { Module, forwardRef } from '@nestjs/common';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitsModule } from '../visits/visits.module';

@Module({
  imports: [PrismaModule, forwardRef(() => VisitsModule)],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
