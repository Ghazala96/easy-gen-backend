import { ArrayMinSize, IsArray, IsMongoId, IsString } from 'class-validator';

export class LoginDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  claimIds: string[];

  @IsString()
  password: string;
}
