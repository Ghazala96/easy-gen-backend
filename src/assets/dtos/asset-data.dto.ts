import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

import { AssetOperation } from '../assets.constants';

export class EmailAssetDataDto {
  @IsEmail()
  @ApiProperty({ example: 'ghazalamarwan@gmail.com' })
  email: string;

  @IsEnum(AssetOperation)
  @ApiProperty({ enum: AssetOperation, example: AssetOperation.Registration })
  operation: AssetOperation;
}
