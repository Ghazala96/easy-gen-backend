import { Prop, Schema } from '@nestjs/mongoose';

import { MinNameLength } from '../user.constants';

@Schema({ _id: false })
export class Name {
  @Prop({ required: true, minlength: MinNameLength })
  first: string;

  @Prop({ required: true, minlength: MinNameLength })
  last: string;
}
