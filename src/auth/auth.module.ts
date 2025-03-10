import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AssetsModule } from '../assets/assets.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RateLimiterModule } from '../rate-limiter/rate-limiter.module';

@Module({
  imports: [
    AssetsModule,
    UsersModule,
    JwtModule.register({
      global: true
    }),
    RateLimiterModule
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
