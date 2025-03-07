import { Module } from '@nestjs/common';

import { OtpsService } from './otps.service';

@Module({
  providers: [OtpsService],
  exports: [OtpsService]
})
export class OtpsModule {}
