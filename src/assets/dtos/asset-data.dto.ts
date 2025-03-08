import { IsEmail, IsEnum } from 'class-validator';

import { AssetOperation } from '../assets.constants';

export class EmailAssetDataDto {
  @IsEmail()
  email: string;

  @IsEnum(AssetOperation)
  operation: AssetOperation;
}
