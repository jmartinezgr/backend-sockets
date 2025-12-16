import { Module } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';

@Module({
  providers: [SensoresService],
  controllers: [SensoresController],
})
export class SensoresModule {}
