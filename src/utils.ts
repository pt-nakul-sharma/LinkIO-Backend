import UAParser from "ua-parser-js";
import { createHash } from "crypto";
import { Platform } from "./types";

/**
 * Generate a fingerprint from IP + User-Agent for deferred deep linking
 * This allows matching users before and after app install
 */
export function generateFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}|${userAgent}`;
  return createHash("sha256").update(data).digest("hex").substring(0, 32);
}

/**
 * Extract client IP from request, handling proxies
 */
export function getClientIP(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return ip.trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function detectPlatform(userAgent: string): Platform {
  const parser = new UAParser(userAgent);
  const os = parser.getOS();

  if (os.name === "iOS") return Platform.IOS;
  if (os.name === "Android") return Platform.ANDROID;

  return Platform.WEB;
}

export function parseQueryParams(url: string): Record<string, any> {
  const urlObj = new URL(url);
  const params: Record<string, any> = {};

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

export function buildDeepLink(
  scheme: string,
  path: string,
  params: Record<string, any>,
): string {
  const queryString = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return `${scheme}://${path}${queryString ? "?" + queryString : ""}`;
}
