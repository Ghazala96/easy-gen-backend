import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { LinkedEntity } from './linked-entity.schema';

export enum AssetType {
  Email = 'email'
}

export enum AssetStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Unverified = 'Unverified',
  Failed = 'Failed'
}

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

  @Prop({ type: Types.ObjectId, required: true, unique: true, default: () => new Types.ObjectId() })
  submitId: Types.ObjectId;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, unique: true, sparse: true })
  claimId?: Types.ObjectId;

  @Prop({ type: LinkedEntity })
  linkedEntity?: LinkedEntity;

  @Prop()
  unlinkedAt?: Date;

  @Prop()
  usedAt?: Date;

  @Prop()
  statusReason?: string;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
