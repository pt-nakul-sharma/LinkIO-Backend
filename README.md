# LinkIO Backend

[![npm version](https://badge.fury.io/js/%40linkio%2Fbackend.svg)](https://www.npmjs.com/package/@linkio/backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Self-hosted deep linking backend for mobile apps. Open-source alternative to Branch.io.

## 🚀 Quick Start

```bash
npm install @linkio/backend
```

```typescript
import express from 'express';
import { LinkIO, InMemoryStorage } from '@linkio/backend';

const app = express();

const linkIO = new LinkIO({
  domain: 'yourdomain.com',
  iosAppId: '123456789',
  iosTeamId: 'TEAMID123',
  iosBundleId: 'com.yourapp.ios',
  androidPackageName: 'com.yourapp.android',
  androidSHA256Fingerprints: ['YOUR_SHA256_FINGERPRINT'],
  storage: new InMemoryStorage()
});

// Domain verification endpoints
app.get('/.well-known/*', linkIO.setupWellKnown());

// Deep link handler
app.get('/refer', linkIO.handleDeepLink());

app.listen(3000);
```

## 📦 Features

- **Universal Links (iOS)** - Automatic apple-app-site-association generation
- **App Links (Android)** - Automatic assetlinks.json generation
- **Smart Redirects** - Detects platform and redirects to App Store/Play Store
- **Deferred Deep Linking** - Preserves link data through app installation
- **Referral Tracking** - Track who referred whom
- **Storage Options** - In-memory, Redis, or custom storage
- **TypeScript** - Full type definitions included

## 📚 Documentation

### Configuration

```typescript
interface LinkIOConfig {
  domain: string;                      // Your domain (e.g., 'yourdomain.com')
  iosAppId: string;                    // Apple App Store ID
  iosTeamId: string;                   // Apple Developer Team ID
  iosBundleId: string;                 // iOS bundle identifier
  androidPackageName: string;          // Android package name
  androidSHA256Fingerprints: string[]; // Android SHA256 cert fingerprints
  storage: LinkIOStorage;              // Storage implementation
}
```

### API Endpoints

```typescript
// Well-known endpoints (auto-generated)
app.get('/.well-known/apple-app-site-association', linkIO.setupWellKnown());
app.get('/.well-known/assetlinks.json', linkIO.setupWellKnown());

// Deep link handler
app.get('/refer', linkIO.handleDeepLink());

// Get pending link (for deferred deep linking)
app.get('/api/pending-link/:deviceId', async (req, res) => {
  const data = await linkIO.getPendingLink(req.params.deviceId);
  res.json(data);
});

// Track referral
app.post('/api/track-referral', async (req, res) => {
  const { referralCode, userId } = req.body;
  await linkIO.trackReferral(referralCode, userId);
  res.json({ success: true });
});

// Get referrals for a user
app.get('/api/referrals/:referrerId', async (req, res) => {
  const referrals = await linkIO.getReferrals(req.params.referrerId);
  res.json({ referrals });
});
```

### Storage Options

**In-Memory (Development)**
```typescript
import { InMemoryStorage } from '@linkio/backend';
const storage = new InMemoryStorage();
```

**Redis (Production)**
```typescript
import { RedisStorage } from '@linkio/backend';
import { createClient } from 'redis';

const redis = await createClient().connect();
const storage = new RedisStorage(redis);
```

**Custom Storage**
```typescript
import { LinkIOStorage } from '@linkio/backend';

class CustomStorage implements LinkIOStorage {
  // Implement interface methods
}
```

## 🔗 Related Packages

- **iOS SDK**: [LinkIO-iOS](https://github.com/yourusername/LinkIO-iOS)
- **Android SDK**: [LinkIO-Android](https://github.com/yourusername/LinkIO-Android)
- **React Native**: [LinkIO-React-Native](https://github.com/yourusername/LinkIO-React-Native)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run example server
npm run dev

# Run tests
npm test
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## 📞 Support

- [GitHub Issues](https://github.com/yourusername/LinkIO-Backend/issues)
- [Documentation](https://github.com/yourusername/LinkIO-Backend#readme)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!
