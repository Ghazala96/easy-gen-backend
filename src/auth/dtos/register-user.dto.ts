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
  claimIds: string[];

  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  @IsStrongPassword() // Checks password strength using zxcvbn even if it passes regex e.g. Password1!, Welcome123!..etc
  password: string;
}
