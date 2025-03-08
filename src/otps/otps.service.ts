import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpsService {
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}
