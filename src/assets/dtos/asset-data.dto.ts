import { IsEmail, IsEnum } from 'class-validator';

export enum EmailAssetOperation {
  Registration = 'registration',
  Login = 'login'
}

export class EmailAssetDataDto {
  @IsEmail()
  email: string;

  @IsEnum(EmailAssetOperation)
  operation: EmailAssetOperation;
}
