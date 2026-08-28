import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AdminSellersController } from './admin-sellers.controller';
import { UsersService } from './users.service';

// Deliberately does NOT import AuthModule: AuthModule already imports this
// module (to reuse findOrCreateByPhone), so doing so back would be a
// circular dependency. It's also unnecessary — JwtAuthGuard (Passport's
// AuthGuard('jwt')) relies on the 'jwt' strategy Passport registers
// globally once AuthModule loads anywhere in the app, and RolesGuard only
// depends on Nest's globally-available Reflector — neither guard actually
// needs a module-scoped provider from AuthModule.
@Module({
  controllers: [UsersController, AdminSellersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
