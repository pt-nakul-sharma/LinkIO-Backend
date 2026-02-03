import { InMemoryStorage } from './InMemoryStorage';
import { PendingLinkData, ReferralData } from '../types';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('Pending Links', () => {
    const mockPendingLink: PendingLinkData = {
      url: 'https://example.com/refer?code=ABC123',
      params: { code: 'ABC123' },
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    it('should save and retrieve pending link', async () => {
      await storage.savePendingLink('device123', mockPendingLink);
      const result = await storage.getPendingLink('device123');
      
      expect(result).toEqual(mockPendingLink);
    });

    it('should return null for non-existent device', async () => {
      const result = await storage.getPendingLink('unknown-device');
      expect(result).toBeNull();
    });

    it('should delete pending link', async () => {
      await storage.savePendingLink('device123', mockPendingLink);
      await storage.deletePendingLink('device123');
      
      const result = await storage.getPendingLink('device123');
      expect(result).toBeNull();
    });

    it('should return null for expired links', async () => {
      const expiredLink: PendingLinkData = {
        ...mockPendingLink,
        expiresAt: Date.now() - 1000
      };
      
      await storage.savePendingLink('device123', expiredLink);
      const result = await storage.getPendingLink('device123');
      
      expect(result).toBeNull();
    });
  });

  describe('Referrals', () => {
    const mockReferral: ReferralData = {
      referrerId: 'user1',
      refereeId: 'user2',
      referralCode: 'ABC123',
      timestamp: Date.now(),
      metadata: { source: 'email' }
    };

    it('should save and retrieve referral by referrer', async () => {
      await storage.saveReferral(mockReferral);
      const results = await storage.getReferralsByReferrer('user1');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockReferral);
    });

    it('should retrieve referral by referee', async () => {
      await storage.saveReferral(mockReferral);
      const result = await storage.getReferralByReferee('user2');
      
      expect(result).toEqual(mockReferral);
    });

    it('should return empty array for referrer with no referrals', async () => {
      const results = await storage.getReferralsByReferrer('unknown-user');
      expect(results).toHaveLength(0);
    });

    it('should return null for referee not found', async () => {
      const result = await storage.getReferralByReferee('unknown-user');
      expect(result).toBeNull();
    });

    it('should not save duplicate referral for same referee', async () => {
      await storage.saveReferral(mockReferral);
      await storage.saveReferral({ ...mockReferral, referrerId: 'user3' });
      
      const results = await storage.getReferralsByReferrer('user1');
      expect(results).toHaveLength(1);
    });

    it('should handle multiple referrals from same referrer', async () => {
      await storage.saveReferral(mockReferral);
      await storage.saveReferral({
        ...mockReferral,
        refereeId: 'user3'
      });
      
      const results = await storage.getReferralsByReferrer('user1');
      expect(results).toHaveLength(2);
    });
  });
});
