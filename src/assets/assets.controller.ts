import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Types } from 'mongoose';

import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dtos/create-asset.dto';
import { VerifyAssetDto } from './dtos/verify-asset.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Post(':submitId/verify')
  async verifyAsset(
    @Param('submitId', ParseMongoIdPipe) submitId: Types.ObjectId,
    @Body() dto: VerifyAssetDto
  ) {
    return this.assetsService.verifyAsset(submitId, dto);
  }

  @Get(':claimId')
  async getAsset(@Param('claimId', ParseMongoIdPipe) claimId: Types.ObjectId) {
    return this.assetsService.getAsset(claimId);
  }
}
