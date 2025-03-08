import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';

import { hashPassword } from '../common/utils';
import { OtpsService } from '../otps/otps.service';
import {
  AssetExpiryInMinMap,
  AssetIdentifierAttributeMap,
  AssetKeyPrefixMap,
  AssetOperation,
  OperationalAssetTypes,
  RequiredAssets
} from './assets.constants';
import { AssetsRepository } from './assets.repository';
import { CreateAssetDto } from './dtos/create-asset.dto';
import { AggregatedAsset, AssetDocument } from './schemas/asset.schema';
import { AssetStatus, AssetType } from './assets.constants';
import { EmailAssetDataDto } from './dtos/asset-data.dto';
import { VerifyAssetDto } from './dtos/verify-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly otpsService: OtpsService,
    private readonly assetsRepo: AssetsRepository
  ) {}

  async createAsset(dto: CreateAssetDto) {
    switch (dto.type) {
      case AssetType.Email:
        return this.createEmailAsset(dto.data as EmailAssetDataDto);
      default:
        throw new BadRequestException('Unsupported asset type');
    }
  }

  private async createEmailAsset(data: EmailAssetDataDto) {
    const otp = this.otpsService.generateOtp();
    //in a real-world application, we would send the OTP via a notification service here

    const type = AssetType.Email;
    const hashedOtp = await hashPassword(otp);
    const asset = await this.assetsRepo.create({
      type,
      key: this.composeKey(type, data),
      data: { ...data, hashedOtp },
      expiresAt: this.getExpiryDate(type)
    });

    //in a prod environment we would not return the OTP
    return { submitId: asset.submitId, otp: asset.data.otp };
  }

  async verifyAsset(submitId: string, dto: VerifyAssetDto) {
    const asset = await this.assetsRepo.findOne({
      submitId,
      status: AssetStatus.Pending,
      expiresAt: { $gte: DateTime.utc().toJSDate() }
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    switch (asset.type) {
      case AssetType.Email:
        if (!dto.code) {
          throw new BadRequestException('Code is required');
        }
        return this.verifyEmailAsset(asset, dto);
      default:
        throw new InternalServerErrorException('Unsupported asset type, possible data corruption');
    }
  }

  private async verifyEmailAsset(asset: AssetDocument, dto: VerifyAssetDto) {
    const isOtpValid = await bcrypt.compare(dto.code, asset.data.hashedOtp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    const claimId = new Types.ObjectId();
    const result = await this.assetsRepo.updateOne(
      { _id: asset._id },
      { claimId, status: AssetStatus.Verified }
    );
    if (!result.modifiedCount) {
      throw new InternalServerErrorException('Failed to mark asset as verified');
    }

    return { claimId };
  }

  async getAsset(claimId: string) {
    const asset = await this.assetsRepo.findAssetWithSameKeyCheck(claimId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const res = {
      claimId: asset.claimId,
      status: asset.status,
      isExpired: asset.isExpired
    };

    switch (asset.status) {
      case AssetStatus.Verified:
        return {
          ...res,
          data: asset.data,
          isLinked: asset.isLinked,
          isUsed: asset.isUsed
        };
      case AssetStatus.Unverified:
      case AssetStatus.Failed:
        return {
          ...res,
          statusReason: asset.statusReason
        };
      default:
        return res;
    }
  }

  areRequiredAssetsValid(operation: AssetOperation, assets: AggregatedAsset[]): boolean {
    switch (operation) {
      case AssetOperation.Registration:
        return this.areRegistrationRequiredAssetsValid(assets);
      default:
        return false;
    }
  }

  areRegistrationRequiredAssetsValid(assets: AggregatedAsset[]): boolean {
    const requiredAssets = RequiredAssets[AssetOperation.Registration];
    const validatedAssetTypes: AssetType[] = [];
    for (const asset of assets) {
      if (!requiredAssets.includes(asset.type)) continue;
      if (validatedAssetTypes.includes(asset.type)) continue;
      if (
        OperationalAssetTypes.includes(asset.type) &&
        asset.data.operation !== AssetOperation.Registration
      )
        continue;
      if (asset.status !== AssetStatus.Verified) continue;
      if (asset.isLinked) continue;
      if (asset.isExpired) continue;

      validatedAssetTypes.push(asset.type);
    }

    return validatedAssetTypes.length === requiredAssets.length;
  }

  private composeKey(type: AssetType, data: EmailAssetDataDto /* | OtherAssetDataDto */): string {
    return `${AssetKeyPrefixMap[type]}-${data[AssetIdentifierAttributeMap[type]]}`;
  }

  private getExpiryDate(type: AssetType): Date {
    const minutes = AssetExpiryInMinMap[type] ?? 5;
    return DateTime.utc().plus({ minutes }).toJSDate();
  }

  async findAssetsWithSameKeysCheck(claimIds: string[]) {
    return this.assetsRepo.findAssetsWithSameKeysCheck(claimIds);
  }
}
