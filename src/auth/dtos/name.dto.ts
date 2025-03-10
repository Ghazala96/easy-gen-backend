import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

import { MinNameLength } from '../../users/user.constants';

export class NameDto {
  @IsString()
  @MinLength(MinNameLength)
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1))
  @ApiProperty({ example: 'Marwan' })
  first: string;

  @IsString()
  @MinLength(MinNameLength)
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1))
  @ApiProperty({ example: 'Ghazala' })
  last: string;
}
