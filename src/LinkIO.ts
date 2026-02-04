import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  LinkIOConfig,
  DeepLinkData,
  PendingLinkData,
  Platform,
  ReferralData,
} from "./types";
import {
  detectPlatform,
  parseQueryParams,
  generateFingerprint,
  generateIPFingerprint,
  getClientIP,
} from "./utils";

export class LinkIO {
  private config: LinkIOConfig;

  constructor(config: LinkIOConfig) {
    this.config = config;
  }

  /**
   * Generic deep link handler - works with any params
   * Usage: app.get('/link', linkIO.handleDeepLink())
   * URLs: /link?type=referral&code=ABC123
   *       /link?type=profile&userId=456
   *       /link?type=car&carId=789
   */
  handleDeepLink() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userAgent = req.headers["user-agent"] || "";
        const platform = detectPlatform(userAgent);
        const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        const params = parseQueryParams(fullUrl);

        // Merge any path params into params object (for backward compatibility)
        Object.keys(req.params).forEach((key) => {
          if (req.params[key]) {
            params[key] = req.params[key];
          }
        });

        const deviceId =
          (req.query.deviceId as string) ||
          (req.headers["x-device-id"] as string);

        // Generate fingerprints for deferred deep linking
        const clientIP = getClientIP(req as any);
        const ipFingerprint = generateIPFingerprint(clientIP); // IP-only for cross-browser/app matching

        const pendingData = {
          url: fullUrl,
          params,
          createdAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        // Save by IP fingerprint for deferred deep linking (works across browser/app)
        await this.config.storage.savePendingLinkByFingerprint(
          ipFingerprint,
          pendingData,
        );
        if (deviceId) {
          await this.config.storage.savePendingLink(deviceId, pendingData);
        }

        if (platform === Platform.IOS) {
          const appScheme = this.config.iosAppScheme;
          const storeUrl = `https://apps.apple.com/app/id${this.config.iosAppId}`;

          if (appScheme) {
            // Smart redirect: try app first, then store
            res.send(
              this.generateSmartRedirectPage(
                appScheme,
                params,
                storeUrl,
                platform,
              ),
            );
          } else {
            res.redirect(storeUrl);
          }
        } else if (platform === Platform.ANDROID) {
          const appScheme = this.config.androidAppScheme;
          const storeUrl = `https://play.google.com/store/apps/details?id=${this.config.androidPackageName}`;

          if (appScheme) {
            // Smart redirect: try app first, then store
            res.send(
              this.generateSmartRedirectPage(
                appScheme,
                params,
                storeUrl,
                platform,
              ),
            );
          } else {
            res.redirect(storeUrl);
          }
        } else {
          res.status(200).json({
            message: "Please open this link on your mobile device",
            platform: "web",
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
      isDeferred: true,
    };
  }

  /**
   * Get pending link by IP fingerprint
   * Used for deferred deep linking when app wasn't installed
   * Uses IP-only matching to work across browser and app (different User-Agents)
   */
  async getPendingLinkByFingerprint(
    ip: string,
    _userAgent?: string, // Kept for backward compatibility, not used
  ): Promise<DeepLinkData | null> {
    const fingerprint = generateIPFingerprint(ip);
    const data =
      await this.config.storage.getPendingLinkByFingerprint(fingerprint);
    if (!data) return null;

    await this.config.storage.deletePendingLinkByFingerprint(fingerprint);

    return {
      url: data.url,
      params: data.params,
      isDeferred: true,
    };
  }

  async trackReferral(
    referralCode: string,
    refereeId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const referral: ReferralData = {
      referrerId: referralCode,
      refereeId,
      referralCode,
      timestamp: Date.now(),
      metadata,
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
            paths: ["*"],
          },
        ],
      },
    };
  }

  generateAssetLinks() {
    return this.config.androidSHA256Fingerprints.map((fingerprint) => ({
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: this.config.androidPackageName,
        sha256_cert_fingerprints: [fingerprint],
      },
    }));
  }

  setupWellKnown() {
    return (req: Request, res: Response) => {
      const path = req.path;

      if (path === "/.well-known/apple-app-site-association") {
        res.json(this.generateAppleAppSiteAssociation());
      } else if (path === "/.well-known/assetlinks.json") {
        res.json(this.generateAssetLinks());
      } else {
        res.status(404).send("Not Found");
      }
    };
  }

  /**
   * Generate HTML page that tries to open the app first, then falls back to store
   */
  private generateSmartRedirectPage(
    appScheme: string,
    params: Record<string, any>,
    storeUrl: string,
    platform: Platform,
  ): string {
    const timeout = this.config.fallbackTimeout || 2500;

    // Build app URI with params
    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join("&");
    const appUri = `${appScheme}://link${queryString ? "?" + queryString : ""}`;

    // For Android, also try intent:// scheme
    const androidIntent =
      platform === Platform.ANDROID
        ? `intent://link${queryString ? "?" + queryString : ""}#Intent;scheme=${appScheme};package=${this.config.androidPackageName};end`
        : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening App...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container { padding: 20px; }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { opacity: 0.9; margin-bottom: 20px; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Opening App...</h1>
    <p>If the app doesn't open, tap below to download</p>
    <a href="${storeUrl}" class="btn">Download App</a>
  </div>
  <script>
    (function() {
      var appUri = "${appUri}";
      var storeUrl = "${storeUrl}";
      var timeout = ${timeout};
      var androidIntent = "${androidIntent}";
      var isAndroid = ${platform === Platform.ANDROID};

      var startTime = Date.now();
      var hasFocus = true;

      // Track if user leaves the page (app opened)
      window.addEventListener('blur', function() { hasFocus = false; });
      window.addEventListener('pagehide', function() { hasFocus = false; });
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) hasFocus = false;
      });

      // Try to open app
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appUri;
      document.body.appendChild(iframe);

      // Also try direct location for some browsers
      setTimeout(function() {
        if (hasFocus) {
          window.location.href = appUri;
        }
      }, 100);

      // Android: try intent scheme as fallback
      if (isAndroid && androidIntent) {
        setTimeout(function() {
          if (hasFocus && Date.now() - startTime < timeout) {
            window.location.href = androidIntent;
          }
        }, 500);
      }

      // Fallback to store after timeout
      setTimeout(function() {
        if (hasFocus && Date.now() - startTime >= timeout - 100) {
          window.location.href = storeUrl;
        }
      }, timeout);
    })();
  </script>
</body>
</html>`;
  }
}
