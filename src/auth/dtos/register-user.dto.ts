import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsString,
  MinLength,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @MinLength(8)
  password: string;
}
