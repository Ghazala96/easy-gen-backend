import { IsString, MinLength } from 'class-validator';

import { MinNameLength } from '../../users/user.constants';

export class NameDto {
  @IsString()
  @MinLength(MinNameLength)
  first: string;

  @IsString()
  @MinLength(MinNameLength)
  last: string;
}
