import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';

import { LinkedEntityType } from '../assets/schemas/linked-entity.schema';
import { AssetOperation, AssetType } from '../assets/assets.constants';
import { AssetsService } from '../assets/assets.service';
import { hashPassword } from '../common/utils';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/user.constants';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
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

    const tokens = await this.generateJwtTokens(user);

    const { __v, password: pw, ...cleanedUser } = user.toObject();

    return {
      user: cleanedUser,
      ...tokens
    };
  }

  async login(dto: LoginDto) {
    const assets = await this.assetsService.findAssetsWithSameKeysCheck(dto.claimIds);
    if (!assets.length) {
      throw new NotFoundException('No assets found with the provided claim IDs');
    }

    const areRequiredAssetsValid = this.assetsService.areRequiredAssetsValid(
      AssetOperation.Login,
      assets
    );
    if (!areRequiredAssetsValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const identifierAsset = assets.find((asset) => asset.type === AssetType.Email);
    const user = await this.usersService.findOne({ email: identifierAsset.data.email });
    if (!user) {
      throw new BadRequestException('Invalid credentials'); // Not possible to reach here
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const assetsUsed = await this.assetsService.useAssets(dto.claimIds);
    if (!assetsUsed) {
      throw new InternalServerErrorException('Failed to mark assets as used');
    }

    const tokens = await this.generateJwtTokens(user);

    return {
      user: { id: user.id },
      ...tokens
    };
  }

  async logout(decodedToken: { sessionId: string; sub: string }) {
    const sessionDeleted: boolean = await this.cacheManager.del(
      `session:userId:${decodedToken.sub}`
    );

    return sessionDeleted;
  }

  async generateJwtTokens(user: UserDocument) {
    const accessSessionId = createId();
    const refreshSessionId = createId();

    const accessPayload = {
      session: accessSessionId,
      sub: user.id,
      role: user.role
    };
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')
    });

    const refreshPayload = {
      session: refreshSessionId,
      sub: user.id
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')
    });

    const key = `session:userId:${user.id}`;
    const value = `${accessSessionId}:${refreshSessionId}`;
    await this.cacheManager.set(key, value);

    return { accessToken, refreshToken };
  }
}
