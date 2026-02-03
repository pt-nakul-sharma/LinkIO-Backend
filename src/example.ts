import express from 'express';
import { LinkIO } from './LinkIO';
import { InMemoryStorage } from './storage/InMemoryStorage';

const app = express();
app.use(express.json());

const linkIO = new LinkIO({
  domain: 'rokart.in',
  iosAppId: '123456789',
  iosTeamId: 'TEAMID123',
  iosBundleId: 'com.rokart.app',
  androidPackageName: 'com.rokart.app',
  androidSHA256Fingerprints: [
    'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'
  ],
  storage: new InMemoryStorage()
});

app.get('/.well-known/*', linkIO.setupWellKnown());

app.get('/refer', linkIO.handleDeepLink());

app.get('/api/pending-link/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = await linkIO.getPendingLink(deviceId);
    
    if (!data) {
      return res.status(404).json({ error: 'No pending link found' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/track-referral', async (req, res) => {
  try {
    const { referralCode, userId, metadata } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await linkIO.trackReferral(referralCode, userId, metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/referrals/:referrerId', async (req, res) => {
  try {
    const { referrerId } = req.params;
    const referrals = await linkIO.getReferrals(referrerId);
    res.json({ referrals });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LinkIO server running on port ${PORT}`);
});
