import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
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
import { AuthSessionKeyPrefix } from './auth.constants';

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
      throw new BadRequestException('Required assets are invalid');
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

  async logout(userId: string) {
    const key = this.composeAuthSessionKey(userId);
    const sessionDeleted: boolean = await this.cacheManager.del(key);
    if (!sessionDeleted) {
      throw new InternalServerErrorException('Failed to log out and delete session');
    }

    return;
  }

  async refreshToken(refreshToken: string) {
    const refreshTokenPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')
    });

    const key = this.composeAuthSessionKey(refreshTokenPayload.sub);
    const session: string = await this.cacheManager.get(key);
    if (!session || session.split(':')[1] !== refreshTokenPayload.sessionId) {
      throw new UnauthorizedException('Session invalid or expired');
    }

    const user = await this.usersService.findOne({ _id: refreshTokenPayload.sub });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessTokenSessionId = createId();
    const accessToken = this.generateAccessToken(user, accessTokenSessionId);
    const newSession = `${accessTokenSessionId}:${refreshTokenPayload.sessionId}`;
    await this.cacheManager.set(key, newSession);

    return { accessToken };
  }

  private async generateJwtTokens(user: UserDocument) {
    const accessTokenSessionId = createId();
    const refreshTokenSessionId = createId();
    const accessToken = this.generateAccessToken(user, accessTokenSessionId);
    const refreshToken = this.generateRefreshToken(user, refreshTokenSessionId);
    const key = this.composeAuthSessionKey(user.id);
    const session = `${accessTokenSessionId}:${refreshTokenSessionId}`;
    await this.cacheManager.set(key, session);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(user: UserDocument, sessionId: string) {
    const payload = {
      sessionId,
      sub: user.id,
      role: user.role
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')
    });

    return accessToken;
  }

  private generateRefreshToken(user: UserDocument, sessionId: string) {
    const payload = {
      sessionId,
      sub: user.id
    };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')
    });

    return refreshToken;
  }

  private composeAuthSessionKey(userId: string) {
    return `${AuthSessionKeyPrefix}${userId}`;
  }
}
