import { LinkIOStorage, PendingLinkData, ReferralData } from '../types';

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

export class RedisStorage implements LinkIOStorage {
  constructor(private redis: RedisClient) {}

  async savePendingLink(deviceId: string, data: PendingLinkData): Promise<void> {
    const key = `linkio:pending:${deviceId}`;
    const ttl = Math.floor((data.expiresAt - Date.now()) / 1000);
    await this.redis.set(key, JSON.stringify(data), { EX: ttl });
  }

  async getPendingLink(deviceId: string): Promise<PendingLinkData | null> {
    const key = `linkio:pending:${deviceId}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    
    const parsed = JSON.parse(data) as PendingLinkData;
    if (Date.now() > parsed.expiresAt) {
      await this.redis.del(key);
      return null;
    }
    
    return parsed;
  }

  async deletePendingLink(deviceId: string): Promise<void> {
    const key = `linkio:pending:${deviceId}`;
    await this.redis.del(key);
  }

  async saveReferral(referral: ReferralData): Promise<void> {
    const existing = await this.getReferralByReferee(referral.refereeId);
    if (!existing) {
      const key = `linkio:referral:${referral.refereeId}`;
      await this.redis.set(key, JSON.stringify(referral));
      
      const referrerKey = `linkio:referrer:${referral.referrerId}`;
      const referees = await this.redis.get(referrerKey);
      const list = referees ? JSON.parse(referees) : [];
      list.push(referral.refereeId);
      await this.redis.set(referrerKey, JSON.stringify(list));
    }
  }

  async getReferralsByReferrer(referrerId: string): Promise<ReferralData[]> {
    const referrerKey = `linkio:referrer:${referrerId}`;
    const referees = await this.redis.get(referrerKey);
    if (!referees) return [];
    
    const list = JSON.parse(referees) as string[];
    const referrals: ReferralData[] = [];
    
    for (const refereeId of list) {
      const key = `linkio:referral:${refereeId}`;
      const data = await this.redis.get(key);
      if (data) {
        referrals.push(JSON.parse(data));
      }
    }
    
    return referrals;
  }

  async getReferralByReferee(refereeId: string): Promise<ReferralData | null> {
    const key = `linkio:referral:${refereeId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
