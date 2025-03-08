import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model, Types, UpdateResult } from 'mongoose';

import { AggregatedAsset, Asset, AssetDocument } from './schemas/asset.schema';

@Injectable()
export class AssetsRepository {
  constructor(@InjectModel(Asset.name) private assetModel: Model<AssetDocument>) {}

  async create(asset: Partial<Asset>): Promise<AssetDocument> {
    return this.assetModel.create(asset);
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>): Promise<UpdateResult> {
    return this.assetModel.updateOne(filter, update);
  }

  async updateMany(
    filter: Record<string, any>,
    update: Record<string, any>
  ): Promise<UpdateResult> {
    return this.assetModel.updateMany(filter, update);
  }

  async findById(id: string): Promise<AssetDocument | null> {
    return this.assetModel.findById(id);
  }

  async findOne(filter: Record<string, any>): Promise<AssetDocument | null> {
    return this.assetModel.findOne(filter);
  }

  async findAssetWithSameKeyCheck(claimId: string): Promise<AggregatedAsset | null> {
    const [asset] = await this.assetModel.aggregate([
      {
        $match: { claimId }
      },
      {
        $lookup: {
          from: this.assetModel.collection.name,
          localField: 'key',
          foreignField: 'key',
          as: 'sameKeyAssets'
        }
      },
      {
        $project: {
          type: 1,
          status: 1,
          data: 1,
          key: 1,
          submitId: 1,
          claimId: 1,
          statusReason: 1,
          isLinked: {
            $cond: {
              if: {
                $anyElementTrue: {
                  $map: {
                    input: '$sameKeyAssets',
                    as: 'asset',
                    in: {
                      $and: [
                        { $ne: ['$$asset.linkedEntity', null] },
                        { $ne: [{ $type: '$$asset.linkedEntity' }, 'missing'] }
                      ]
                    }
                  }
                }
              },
              then: true,
              else: false
            }
          },
          isExpired: {
            $cond: {
              if: { $lt: ['$expiresAt', DateTime.utc().toJSDate()] },
              then: true,
              else: false
            }
          },
          isUsed: {
            $cond: {
              if: {
                $and: [{ $ne: ['$usedAt', null] }, { $ne: [{ $type: '$usedAt' }, 'missing'] }]
              },
              then: true,
              else: false
            }
          }
        }
      }
    ]);

    return asset ?? null;
  }

  async findAssetsWithSameKeysCheck(claimIds: string[]): Promise<AggregatedAsset[]> {
    return this.assetModel.aggregate([
      {
        $match: {
          claimId: { $in: claimIds }
        }
      },
      {
        $lookup: {
          from: this.assetModel.collection.name,
          localField: 'key',
          foreignField: 'key',
          as: 'sameKeyAssets'
        }
      },
      {
        $project: {
          type: 1,
          status: 1,
          data: 1,
          key: 1,
          submitId: 1,
          claimId: 1,
          statusReason: 1,
          isLinked: {
            $cond: {
              if: {
                $anyElementTrue: {
                  $map: {
                    input: '$sameKeyAssets',
                    as: 'asset',
                    in: {
                      $and: [
                        { $ne: ['$$asset.linkedEntity', null] },
                        { $ne: [{ $type: '$$asset.linkedEntity' }, 'missing'] }
                      ]
                    }
                  }
                }
              },
              then: true,
              else: false
            }
          },
          isExpired: {
            $cond: {
              if: { $lt: ['$expiresAt', DateTime.utc().toJSDate()] },
              then: true,
              else: false
            }
          },
          isUsed: {
            $cond: {
              if: {
                $and: [{ $ne: ['$usedAt', null] }, { $ne: [{ $type: '$usedAt' }, 'missing'] }]
              },
              then: true,
              else: false
            }
          }
        }
      }
    ]);
  }
}
