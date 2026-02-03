import UAParser from 'ua-parser-js';
import { Platform } from './types';

export function detectPlatform(userAgent: string): Platform {
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  
  if (os.name === 'iOS') return Platform.IOS;
  if (os.name === 'Android') return Platform.ANDROID;
  
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

export function buildDeepLink(scheme: string, path: string, params: Record<string, any>): string {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${scheme}://${path}${queryString ? '?' + queryString : ''}`;
}
