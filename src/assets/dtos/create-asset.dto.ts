import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, ValidateNested } from 'class-validator';

import { AssetType } from '../schemas/asset.schema';
import { EmailAssetDataDto } from './asset-data.dto';

export class CreateAssetDto {
  @IsEnum(AssetType)
  type: AssetType;

  @IsObject()
  @ValidateNested()
  @Type(({ object }) => {
    switch (object.type) {
      case AssetType.Email:
        return EmailAssetDataDto;
      default:
        throw new BadRequestException('Unsupported asset type');
    }
  })
  data: EmailAssetDataDto; // | OtherAssetDataDto;
}
