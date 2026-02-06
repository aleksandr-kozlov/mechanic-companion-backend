import { Module, forwardRef } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CarsModule)],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
