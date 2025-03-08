import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { UserRole } from '../user.constants';
import { Name } from './name.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: Name, required: true })
  name: Name;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, required: true })
  role: UserRole;

  //TODO: Add role tags for finer-grained access control
}

export const UserSchema = SchemaFactory.createForClass(User);
