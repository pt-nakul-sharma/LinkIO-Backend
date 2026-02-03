import { LinkIO } from './LinkIO';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { LinkIOConfig } from './types';

describe('LinkIO', () => {
  let linkIO: LinkIO;
  let storage: InMemoryStorage;

  const mockConfig: LinkIOConfig = {
    domain: 'example.com',
    iosAppId: '123456789',
    iosTeamId: 'TEAMID123',
    iosBundleId: 'com.example.app',
    androidPackageName: 'com.example.app',
    androidSHA256Fingerprints: ['AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'],
    storage: null as any
  };

  beforeEach(() => {
    storage = new InMemoryStorage();
    linkIO = new LinkIO({ ...mockConfig, storage });
  });

  describe('generateAppleAppSiteAssociation', () => {
    it('should generate valid AASA structure', () => {
      const aasa = (linkIO as any).generateAppleAppSiteAssociation();
      
      expect(aasa).toHaveProperty('applinks');
      expect(aasa.applinks).toHaveProperty('apps');
      expect(aasa.applinks.apps).toEqual([]);
      expect(aasa.applinks).toHaveProperty('details');
      expect(aasa.applinks.details[0].appID).toBe('TEAMID123.com.example.app');
      expect(aasa.applinks.details[0].paths).toContain('*');
    });
  });

  describe('generateAssetLinks', () => {
    it('should generate valid Android asset links', () => {
      const assetLinks = (linkIO as any).generateAssetLinks();
      
      expect(assetLinks).toHaveLength(1);
      expect(assetLinks[0].relation).toContain('delegate_permission/common.handle_all_urls');
      expect(assetLinks[0].target.namespace).toBe('android_app');
      expect(assetLinks[0].target.package_name).toBe('com.example.app');
      expect(assetLinks[0].target.sha256_cert_fingerprints).toContain(
        'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'
      );
    });

    it('should handle multiple fingerprints', () => {
      const multiFingerprint = new LinkIO({
        ...mockConfig,
        storage,
        androidSHA256Fingerprints: ['FINGERPRINT1', 'FINGERPRINT2']
      });
      
      const assetLinks = (multiFingerprint as any).generateAssetLinks();
      expect(assetLinks).toHaveLength(2);
    });
  });

  describe('getPendingLink', () => {
    it('should return pending link and delete it', async () => {
      const mockData = {
        url: 'https://example.com/refer?code=ABC',
        params: { code: 'ABC' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 100000
      };
      
      await storage.savePendingLink('device123', mockData);
      
      const result = await linkIO.getPendingLink('device123');
      expect(result).toBeTruthy();
      expect(result?.url).toBe(mockData.url);
      expect(result?.isDeferred).toBe(true);
      
      const secondResult = await linkIO.getPendingLink('device123');
      expect(secondResult).toBeNull();
    });

    it('should return null for non-existent device', async () => {
      const result = await linkIO.getPendingLink('unknown');
      expect(result).toBeNull();
    });
  });

  describe('trackReferral', () => {
    it('should track referral successfully', async () => {
      await linkIO.trackReferral('ABC123', 'user456', { source: 'email' });
      
      const referrals = await linkIO.getReferrals('ABC123');
      expect(referrals).toHaveLength(1);
      expect(referrals[0].refereeId).toBe('user456');
      expect(referrals[0].metadata?.source).toBe('email');
    });
  });

  describe('getReferrals', () => {
    it('should return all referrals for a referrer', async () => {
      await linkIO.trackReferral('REF001', 'user1');
      await linkIO.trackReferral('REF001', 'user2');
      
      const referrals = await linkIO.getReferrals('REF001');
      expect(referrals).toHaveLength(2);
    });

    it('should return empty array for unknown referrer', async () => {
      const referrals = await linkIO.getReferrals('unknown');
      expect(referrals).toHaveLength(0);
    });
  });

  describe('getReferralForUser', () => {
    it('should return referral for user', async () => {
      await linkIO.trackReferral('REF001', 'user123');
      
      const referral = await linkIO.getReferralForUser('user123');
      expect(referral).toBeTruthy();
      expect(referral?.referralCode).toBe('REF001');
    });

    it('should return null for user without referral', async () => {
      const referral = await linkIO.getReferralForUser('unknown');
      expect(referral).toBeNull();
    });
  });
});
