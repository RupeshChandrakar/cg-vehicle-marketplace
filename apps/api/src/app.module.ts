import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './infra/prisma/prisma.module';
import { StorageModule } from './infra/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { VehicleMediaModule } from './modules/vehicle-media/vehicle-media.module';
import { AuthModule } from './modules/auth/auth.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    LocationsModule,
    UsersModule,
    VehiclesModule,
    VehicleMediaModule,
    EnquiriesModule,
  ],
})
export class AppModule {}
