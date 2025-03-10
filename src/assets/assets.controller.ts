import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { Public } from '../common/decorators/auth/public.decorator';
import { ValidateMongoIdPipe } from '../common/pipes/validate-mongo-id.pipe';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dtos/create-asset.dto';
import { VerifyAssetDto } from './dtos/verify-asset.dto';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a verification asset' })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns a submit id used for verifying asset'
  })
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(dto);
  }

  @Public()
  @Post(':submitId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a verification asset' })
  @ApiBody({ type: VerifyAssetDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a claim id after verification' })
  async verifyAsset(
    @Param('submitId', ValidateMongoIdPipe) submitId: string,
    @Body() dto: VerifyAssetDto
  ) {
    return this.assetsService.verifyAsset(submitId, dto);
  }

  @Public()
  @Get(':claimId')
  @ApiOperation({ summary: 'Get a verification asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a verification asset i.e id, data and status'
  })
  async getAsset(@Param('claimId', ValidateMongoIdPipe) claimId: string) {
    return this.assetsService.getAsset(claimId);
  }
}
