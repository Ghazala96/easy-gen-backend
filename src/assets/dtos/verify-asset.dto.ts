import { IsOptional, IsString } from 'class-validator';

export class VerifyAssetDto {
  @IsOptional()
  @IsString()
  code?: string; // OTP or any similar verification code.
}
