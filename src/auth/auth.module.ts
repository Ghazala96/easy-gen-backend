import { Module } from '@nestjs/common';

import { AssetsModule } from '../assets/assets.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [AssetsModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
