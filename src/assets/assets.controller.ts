import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Types } from 'mongoose';

import { ValidateMongoIdPipe } from '../common/pipes/validate-mongo-id.pipe';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dtos/create-asset.dto';
import { VerifyAssetDto } from './dtos/verify-asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Post(':submitId/verify')
  async verifyAsset(
    @Param('submitId', ValidateMongoIdPipe) submitId: string,
    @Body() dto: VerifyAssetDto
  ) {
    return this.assetsService.verifyAsset(submitId, dto);
  }

  @Get(':claimId')
  async getAsset(@Param('claimId', ValidateMongoIdPipe) claimId: string) {
    return this.assetsService.getAsset(claimId);
  }
}
