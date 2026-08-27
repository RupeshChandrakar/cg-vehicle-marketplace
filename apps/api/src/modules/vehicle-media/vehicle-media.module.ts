import { Module } from '@nestjs/common';
import { VehicleMediaController } from './vehicle-media.controller';
import { VehicleMediaService } from './vehicle-media.service';

@Module({
  controllers: [VehicleMediaController],
  providers: [VehicleMediaService],
})
export class VehicleMediaModule {}
