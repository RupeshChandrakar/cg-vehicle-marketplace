import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehicleStatusService } from './vehicle-status.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehicleStatusService],
})
export class VehiclesModule {}
