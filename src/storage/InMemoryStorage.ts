import { LinkIOStorage, PendingLinkData, ReferralData } from '../types';

export class InMemoryStorage implements LinkIOStorage {
  private pendingLinks: Map<string, PendingLinkData> = new Map();
  private referrals: ReferralData[] = [];

  async savePendingLink(deviceId: string, data: PendingLinkData): Promise<void> {
    this.pendingLinks.set(deviceId, data);
    
    setTimeout(() => {
      this.deletePendingLink(deviceId);
    }, data.expiresAt - Date.now());
  }

  async getPendingLink(deviceId: string): Promise<PendingLinkData | null> {
    const data = this.pendingLinks.get(deviceId);
    if (!data) return null;
    
    if (Date.now() > data.expiresAt) {
      this.pendingLinks.delete(deviceId);
      return null;
    }
    
    return data;
  }

  async deletePendingLink(deviceId: string): Promise<void> {
    this.pendingLinks.delete(deviceId);
  }

  async saveReferral(referral: ReferralData): Promise<void> {
    const existing = await this.getReferralByReferee(referral.refereeId);
    if (!existing) {
      this.referrals.push(referral);
    }
  }

  async getReferralsByReferrer(referrerId: string): Promise<ReferralData[]> {
    return this.referrals.filter(r => r.referrerId === referrerId);
  }

  async getReferralByReferee(refereeId: string): Promise<ReferralData | null> {
    return this.referrals.find(r => r.refereeId === refereeId) || null;
  }
}
