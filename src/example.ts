import express from "express";
import { LinkIO } from "./LinkIO";
import { InMemoryStorage } from "./storage/InMemoryStorage";

const app = express();
app.use(express.json());

const linkIO = new LinkIO({
  domain: "rokart.in",
  iosAppId: "123456789",
  iosTeamId: "TEAMID123",
  iosBundleId: "com.rokart.app",
  iosAppScheme: "rokart", // Custom URL scheme for iOS (rokart://)
  androidPackageName: "com.rokart.app",
  androidAppScheme: "rokart", // Custom URL scheme for Android (rokart://)
  androidSHA256Fingerprints: [
    "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
  ],
  fallbackTimeout: 2500, // Wait 2.5s before redirecting to store
  storage: new InMemoryStorage(),
});

// Well-known files - required at domain root for iOS/Android verification
app.get("/.well-known/*", linkIO.setupWellKnown());

// Generic deep link handler - works with any params
// Examples:
//   /link?referralCode=ABC123
//   /link?userId=456
//   /link?carId=789
//   /link?referralCode=ABC&campaign=summer   (multiple params)
app.get("/link", linkIO.handleDeepLink());

// Optional: Path-based routes for cleaner URLs (backward compatible)
// app.get('/refer/:referralCode', linkIO.handleDeepLink());
// app.get('/profile/:userId', linkIO.handleDeepLink());

// ===========================================
// API ENDPOINTS - Use these methods in YOUR project's existing routes
// The URL patterns below are just examples - adapt to your project's structure
// ===========================================

// Get pending link for deferred deep linking (by deviceId)
app.get("/pending-link/:deviceId", async (req, res) => {
  const data = await linkIO.getPendingLink(req.params.deviceId);
  if (!data) {
    return res.status(404).json({ error: "No pending link found" });
  }
  res.json(data);
});

// Get pending link by fingerprint (IP + User-Agent)
// SDK calls this after app install to retrieve saved deep link params
app.get("/pending-link", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";

  const data = await linkIO.getPendingLinkByFingerprint(ip, userAgent);
  if (!data) {
    return res.status(404).json({ error: "No pending link found" });
  }
  res.json(data);
});

// Track a referral
app.post("/track-referral", async (req, res) => {
  const { referralCode, userId, metadata } = req.body;
  await linkIO.trackReferral(referralCode, userId, metadata);
  res.json({ success: true });
});

// Get referrals by referrer
app.get("/referrals/:referrerId", async (req, res) => {
  const referrals = await linkIO.getReferrals(req.params.referrerId);
  res.json({ referrals });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LinkIO server running on port ${PORT}`);
});
