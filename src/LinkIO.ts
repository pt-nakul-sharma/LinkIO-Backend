import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LinkIOConfig, DeepLinkData, PendingLinkData, Platform, ReferralData } from './types';
import { detectPlatform, parseQueryParams } from './utils';

export class LinkIO {
  private config: LinkIOConfig;

  constructor(config: LinkIOConfig) {
    this.config = config;
  }

  handleDeepLink() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userAgent = req.headers['user-agent'] || '';
        const platform = detectPlatform(userAgent);
        const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const params = parseQueryParams(fullUrl);
        
        const deviceId = req.query.deviceId as string || req.headers['x-device-id'] as string;
        
        if (platform === Platform.IOS) {
          if (deviceId) {
            await this.config.storage.savePendingLink(deviceId, {
              url: fullUrl,
              params,
              createdAt: Date.now(),
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            });
          }
          
          res.redirect(`https://apps.apple.com/app/id${this.config.iosAppId}`);
        } else if (platform === Platform.ANDROID) {
          if (deviceId) {
            await this.config.storage.savePendingLink(deviceId, {
              url: fullUrl,
              params,
              createdAt: Date.now(),
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
            });
          }
          
          res.redirect(`https://play.google.com/store/apps/details?id=${this.config.androidPackageName}`);
        } else {
          res.status(200).json({
            message: 'Please open this link on your mobile device',
            platform: 'web'
          });
        }
      } catch (error) {
        next(error);
      }
    };
  }

  async getPendingLink(deviceId: string): Promise<DeepLinkData | null> {
    const data = await this.config.storage.getPendingLink(deviceId);
    if (!data) return null;

    await this.config.storage.deletePendingLink(deviceId);

    return {
      url: data.url,
      params: data.params,
      isDeferred: true
    };
  }

  async trackReferral(referralCode: string, refereeId: string, metadata?: Record<string, any>): Promise<void> {
    const referral: ReferralData = {
      referrerId: referralCode,
      refereeId,
      referralCode,
      timestamp: Date.now(),
      metadata
    };

    await this.config.storage.saveReferral(referral);
  }

  async getReferrals(referrerId: string): Promise<ReferralData[]> {
    return this.config.storage.getReferralsByReferrer(referrerId);
  }

  async getReferralForUser(userId: string): Promise<ReferralData | null> {
    return this.config.storage.getReferralByReferee(userId);
  }

  generateAppleAppSiteAssociation() {
    return {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${this.config.iosTeamId}.${this.config.iosBundleId}`,
            paths: ['*']
          }
        ]
      }
    };
  }

  generateAssetLinks() {
    return this.config.androidSHA256Fingerprints.map(fingerprint => ({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: this.config.androidPackageName,
        sha256_cert_fingerprints: [fingerprint]
      }
    }));
  }

  setupWellKnown() {
    return (req: Request, res: Response) => {
      const path = req.path;
      
      if (path === '/.well-known/apple-app-site-association') {
        res.json(this.generateAppleAppSiteAssociation());
      } else if (path === '/.well-known/assetlinks.json') {
        res.json(this.generateAssetLinks());
      } else {
        res.status(404).send('Not Found');
      }
    };
  }
}
