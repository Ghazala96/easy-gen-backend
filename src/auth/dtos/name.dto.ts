import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

import { MinNameLength } from '../../users/user.constants';

export class NameDto {
  @IsString()
  @MinLength(MinNameLength)
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1))
  first: string;

  @IsString()
  @MinLength(MinNameLength)
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1))
  last: string;
}
