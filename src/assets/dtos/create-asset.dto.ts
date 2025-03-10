import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, ValidateNested } from 'class-validator';

import { AssetType } from '../assets.constants';
import { EmailAssetDataDto } from './asset-data.dto';

export class CreateAssetDto {
  @IsEnum(AssetType)
  @ApiProperty({ enum: AssetType, example: AssetType.Email })
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
  @ApiProperty({ type: EmailAssetDataDto })
  data: EmailAssetDataDto; // | OtherAssetDataDto;
}
