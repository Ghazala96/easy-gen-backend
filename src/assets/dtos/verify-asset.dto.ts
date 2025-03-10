import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyAssetDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: '123456', description: 'OTP or any similar verification code' })
  code?: string; // OTP or any similar verification code.
}
