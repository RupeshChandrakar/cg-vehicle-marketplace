import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './infra/prisma/prisma.module';
import { StorageModule } from './infra/storage/storage.module';
import { SmsModule } from './infra/sms/sms.module';
import { AiModule } from './infra/ai/ai.module';
import { VideoModule } from './infra/video/video.module';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { VehicleMediaModule } from './modules/vehicle-media/vehicle-media.module';
import { AuthModule } from './modules/auth/auth.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReelsModule } from './modules/reels/reels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StorageModule,
    SmsModule,
    AiModule,
    VideoModule,
    NotificationsModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    LocationsModule,
    UsersModule,
    VehiclesModule,
    VehicleMediaModule,
    EnquiriesModule,
    FavoritesModule,
    ReviewsModule,
    ReelsModule,
  ],
})
export class AppModule {}
