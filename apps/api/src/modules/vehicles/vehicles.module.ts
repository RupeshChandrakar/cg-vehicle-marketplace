import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { AdminVehiclesController } from './admin-vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehicleStatusService } from './vehicle-status.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [VehiclesController, AdminVehiclesController],
  providers: [VehiclesService, VehicleStatusService],
  // Favorites/Reviews reuse VehiclesService's public-shaping logic
  // (toPublicVehicle, media URL resolution, specs stripping) rather than
  // duplicating it.
  exports: [VehiclesService],
})
export class VehiclesModule {}
