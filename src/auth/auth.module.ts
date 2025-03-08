import { Module } from '@nestjs/common';

import { AssetsModule } from '../assets/assets.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AssetsModule,
    UsersModule,
    JwtModule.register({
      global: true
    })
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
