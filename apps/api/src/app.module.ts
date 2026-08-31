import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FinanceEnquiriesModule } from './modules/finance-enquiries/finance-enquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // Generous global default (keyed per-IP) so normal browsing -- listing,
    // search, vehicle detail -- never gets caught. Sensitive unauthenticated
    // routes (OTP request/verify, staff login, finance enquiries) override
    // this with a tighter @Throttle() limit at the controller method.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
    AnalyticsModule,
    FinanceEnquiriesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
