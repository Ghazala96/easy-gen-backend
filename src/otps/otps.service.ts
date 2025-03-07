import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class OtpsService {
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}
