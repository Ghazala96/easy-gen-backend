import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime, Duration } from 'luxon';

@Injectable()
export class RateLimiterService {
  private readonly maxAttempts = 3;
  private readonly attemptDuration = Duration.fromObject({ minutes: 15 }).as('milliseconds');
  private readonly blockDuration = Duration.fromObject({ minutes: 60 }).as('milliseconds');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async isBlocked(userIdentifier: string, operation: string): Promise<boolean> {
    const blockKey = this.getBlockKey(userIdentifier, operation);
    return Boolean(await this.cacheManager.get(blockKey));
  }

  async incrementFailure(userIdentifier: string, operation: string) {
    const attemptsKey = this.getAttemptsKey(userIdentifier, operation);
    const blockKey = this.getBlockKey(userIdentifier, operation);

    const attempts = (await this.cacheManager.get<number>(attemptsKey)) || 0;
    let ttl = this.attemptDuration;
    if (attempts > 0) {
      ttl = await this.getTTL(attemptsKey);
    }

    const newAttempts = attempts + 1;
    await this.cacheManager.set(attemptsKey, newAttempts, ttl);

    if (newAttempts >= this.maxAttempts) {
      await this.cacheManager.set(blockKey, true, this.blockDuration);
      return { attempts: newAttempts, isBlocked: true };
    }

    return { attempts: newAttempts, isBlocked: false };
  }

  private getBlockKey(userIdentifier: string, operation: string) {
    return `rate-limit:block:${operation}:${userIdentifier}`;
  }

  private getAttemptsKey(userIdentifier: string, operation: string) {
    return `rate-limit:attempts:${operation}:${userIdentifier}`;
  }

  private async getTTL(key: string): Promise<number | undefined> {
    const ttl = await this.cacheManager.ttl(key);
    const now = DateTime.utc();
    const expiryTime = DateTime.fromMillis(ttl);
    const remainingTTL = expiryTime.diff(now, 'milliseconds').milliseconds;

    return remainingTTL;
  }

  async resetAttempts(userIdentifier: string, operation: string) {
    await this.cacheManager.del(this.getAttemptsKey(userIdentifier, operation));
  }
}
