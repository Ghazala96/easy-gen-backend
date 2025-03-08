import { Injectable, NotFoundException } from '@nestjs/common';

import { AggregatedAsset } from '../assets/schemas/asset.schema';
import { AssetType } from '../assets/assets.constants';
import { UsersRepository } from './users.repository';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getUserProfile(userId: string) {
    const user = await this.usersRepo.findSanitizedById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  composeUserDataFromAssets(assets: AggregatedAsset[]) {
    const userData: { email?: string } = {};
    for (const asset of assets) {
      switch (asset.type) {
        case AssetType.Email:
          userData.email = asset.data.email;
          break;
      }
    }

    return userData;
  }

  async create(user: Partial<User>): Promise<UserDocument> {
    return this.usersRepo.create(user);
  }

  async findOne(filter: Record<string, any>): Promise<UserDocument | null> {
    return this.usersRepo.findOne(filter);
  }
}
