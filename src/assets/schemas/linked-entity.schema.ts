import { Prop, Schema } from '@nestjs/mongoose';

export enum LinkedEntityType {
  User = 'User'
}

@Schema({ _id: false })
export class LinkedEntity {
  @Prop({ enum: LinkedEntityType, required: true })
  type: LinkedEntityType;

  @Prop({ required: true })
  id: string;
}
