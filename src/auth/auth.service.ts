import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { LinkedEntityType } from '../assets/schemas/linked-entity.schema';
import { AssetOperation } from '../assets/assets.constants';
import { AssetsService } from '../assets/assets.service';
import { hashPassword } from '../common/utils';
import { UserRole } from '../users/user.constants';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dtos/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly usersService: UsersService
  ) {}

  async registerUser(dto: RegisterUserDto) {
    const assets = await this.assetsService.findAssetsWithSameKeysCheck(dto.claimIds);
    if (!assets.length) {
      throw new NotFoundException('No assets found with the provided claim IDs');
    }

    const areRequiredAssetsValid = this.assetsService.areRequiredAssetsValid(
      AssetOperation.Registration,
      assets
    );
    if (!areRequiredAssetsValid) {
      throw new NotFoundException('Required assets are invalid');
    }

    const { claimIds, password, ...cleanedDto } = dto;
    const userData = this.usersService.composeUserDataFromAssets(assets);
    const user = await this.usersService.create({
      ...cleanedDto,
      ...userData,
      password: await hashPassword(password),
      role: UserRole.User
    });

    const assetsLinked = await this.assetsService.linkAssets(claimIds, {
      type: LinkedEntityType.User,
      id: user.id
    });
    if (!assetsLinked) {
      throw new InternalServerErrorException('Failed to link assets');
    }

    const { __v, password: pw, ...cleanedUser } = user.toObject();

    return cleanedUser;
  }
}
