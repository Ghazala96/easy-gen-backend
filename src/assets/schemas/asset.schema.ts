import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { LinkedEntity } from './linked-entity.schema';
import { AssetStatus, AssetType } from '../assets.constants';

export type AssetDocument = HydratedDocument<Asset>;

@Schema({ timestamps: true })
export class Asset {
  @Prop({ enum: AssetType, required: true })
  type: AssetType;

  @Prop({ required: true, trim: true, index: true })
  key: string;

  @Prop({ enum: AssetStatus, default: AssetStatus.Pending, required: true })
  status: AssetStatus;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ required: true, unique: true, default: () => new Types.ObjectId() })
  submitId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ unique: true, sparse: true })
  claimId?: string;

  @Prop({ type: LinkedEntity })
  linkedEntity?: LinkedEntity;

  @Prop()
  usedAt?: Date;

  @Prop()
  statusReason?: string;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);

//TODO: Rename to something more descriptive
export type AggregatedAsset = Pick<
  Asset,
  'type' | 'key' | 'status' | 'data' | 'submitId' | 'claimId' | 'statusReason'
> & {
  _id: Types.ObjectId;
  isLinked: boolean;
  isExpired: boolean;
  isUsed: boolean;
};
