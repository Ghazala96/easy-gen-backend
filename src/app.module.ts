import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { AssetsModule } from './assets/assets.module';
import { OtpsModule } from './otps/otps.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'), //TODO: Add as env variable and add event listeners
    AssetsModule,
    OtpsModule
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        forbidNonWhitelisted: true
      })
    }
  ]
})
export class AppModule {}
