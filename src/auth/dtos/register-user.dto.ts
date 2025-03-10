import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsString,
  Matches,
  MinLength,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

import { IsStrongPassword } from '../../common/decorators/validation/is-strong-password.decorator';
import { NameDto } from './name.dto';

export class RegisterUserDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @ApiProperty({ example: ['5f5a6f2c8f2f3c001f2e4b4a'] })
  claimIds: string[];

  @ValidateNested()
  @Type(() => NameDto)
  @ApiProperty({ type: NameDto })
  name: NameDto;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  @IsStrongPassword() // Checks password strength using zxcvbn even if it passes regex e.g. Password1!, Welcome123!..etc
  @ApiProperty({ example: 'Ice!mg@123' })
  password: string;
}
