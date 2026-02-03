export interface LinkIOConfig {
  domain: string;
  iosAppId: string;
  iosTeamId: string;
  iosBundleId: string;
  androidPackageName: string;
  androidSHA256Fingerprints: string[];
  defaultDeepLinkPath?: string;
  storage: LinkIOStorage;
}

export interface LinkIOStorage {
  savePendingLink(deviceId: string, data: PendingLinkData): Promise<void>;
  getPendingLink(deviceId: string): Promise<PendingLinkData | null>;
  deletePendingLink(deviceId: string): Promise<void>;
  saveReferral(referral: ReferralData): Promise<void>;
  getReferralsByReferrer(referrerId: string): Promise<ReferralData[]>;
  getReferralByReferee(refereeId: string): Promise<ReferralData | null>;
}

export interface PendingLinkData {
  url: string;
  params: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

export interface ReferralData {
  referrerId: string;
  refereeId: string;
  referralCode: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DeepLinkData {
  url: string;
  params: Record<string, any>;
  isDeferred: boolean;
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  UNKNOWN = 'unknown'
}
