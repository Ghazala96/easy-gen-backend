import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId, IsString } from 'class-validator';

export class LoginDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @ApiProperty({ example: ['5f5a6f2c8f2f3c001f2e4b4a'] })
  claimIds: string[];

  @IsString()
  @ApiProperty({ example: 'password123456' })
  password: string;
}
