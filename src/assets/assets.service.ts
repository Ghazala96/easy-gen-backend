import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
import { AggregatedAsset, Asset, AssetDocument } from './schemas/asset.schema';
import { LinkedEntity } from './schemas/linked-entity.schema';
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
    return { submitId: asset.submitId, otp };
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
          throw new BadRequestException(['code should not be empty']); // temporary solution to match validation messages
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

    const sanitizedAsset: Partial<AggregatedAsset> = this.sanitizeAsset(asset);
    const res = {
      claimId: sanitizedAsset.claimId,
      status: sanitizedAsset.status,
      isExpired: sanitizedAsset.isExpired
    };

    switch (sanitizedAsset.status) {
      case AssetStatus.Verified:
        return {
          ...res,
          data: sanitizedAsset.data,
          isLinked: sanitizedAsset.isLinked,
          isUsed: sanitizedAsset.isUsed
        };
      case AssetStatus.Unverified:
      case AssetStatus.Failed:
        return {
          ...res,
          statusReason: sanitizedAsset.statusReason
        };
      default:
        return res;
    }
  }

  areRequiredAssetsValid(operation: AssetOperation, assets: AggregatedAsset[]): boolean {
    switch (operation) {
      case AssetOperation.Registration:
        return this.areRegistrationRequiredAssetsValid(assets);
      case AssetOperation.Login:
        return this.areOperationalRequiredAssetsValid(operation, assets);
      default:
        return false;
    }
  }

  private areRegistrationRequiredAssetsValid(assets: AggregatedAsset[]): boolean {
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

  //TODO: Come up with a more descriptive name because this shouldn't include registration
  private areOperationalRequiredAssetsValid(
    operation: AssetOperation,
    assets: AggregatedAsset[]
  ): boolean {
    const requiredAssets = RequiredAssets[operation];
    if (!requiredAssets) return false;

    const validatedAssetTypes: AssetType[] = [];
    for (const asset of assets) {
      if (!requiredAssets.includes(asset.type)) continue;
      if (validatedAssetTypes.includes(asset.type)) continue;
      if (!OperationalAssetTypes.includes(asset.type)) continue;
      if (!asset.data.operation) continue;
      if (asset.data.operation === AssetOperation.Registration) continue;
      if (asset.data.operation !== operation) continue;
      if (asset.status !== AssetStatus.Verified) continue;
      if (!asset.isLinked) continue;
      if (asset.isExpired) continue;
      if (asset.isUsed) continue;

      validatedAssetTypes.push(asset.type);
    }

    return validatedAssetTypes.length === requiredAssets.length;
  }

  async linkAssets(claimIds: string[], linkedEntity: LinkedEntity) {
    const result = await this.assetsRepo.updateMany(
      {
        claimId: { $in: claimIds },
        status: AssetStatus.Verified,
        linkedEntity: { $exists: false }
      },
      {
        linkedEntity,
        usedAt: DateTime.utc().toJSDate()
      }
    );

    return result.modifiedCount === claimIds.length;
  }

  async useAssets(claimIds: string[]) {
    const result = await this.assetsRepo.updateMany(
      {
        claimId: { $in: claimIds },
        status: AssetStatus.Verified,
        linkedEntity: { $exists: false },
        usedAt: { $exists: false }
      },
      {
        usedAt: DateTime.utc().toJSDate()
      }
    );

    return result.modifiedCount === claimIds.length;
  }

  private sanitizeAsset(asset: Asset | AggregatedAsset): Partial<Asset | AggregatedAsset> {
    switch (asset.type) {
      case AssetType.Email:
        delete asset.data.hashedOtp;
        return asset;
      default:
        return asset;
    }
  }

  private composeKey(type: AssetType, data: EmailAssetDataDto /* | OtherAssetDataDto */): string {
    return `${AssetKeyPrefixMap[type]}-${data[AssetIdentifierAttributeMap[type]]}`;
  }

  private getExpiryDate(type: AssetType): Date {
    const minutes = AssetExpiryInMinMap[type] ?? 5;
    return DateTime.utc().plus({ minutes }).toJSDate();
  }

  async findAssetWithSameKeyCheck(claimId: string) {
    return this.assetsRepo.findAssetWithSameKeyCheck(claimId);
  }

  async findAssetsWithSameKeysCheck(claimIds: string[]) {
    return this.assetsRepo.findAssetsWithSameKeysCheck(claimIds);
  }
}
