import { detectPlatform, parseQueryParams, buildDeepLink } from './utils';
import { Platform } from './types';

describe('detectPlatform', () => {
  it('should detect iOS from iPhone user agent', () => {
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15';
    expect(detectPlatform(userAgent)).toBe(Platform.IOS);
  });

  it('should detect iOS from iPad user agent', () => {
    const userAgent = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15';
    expect(detectPlatform(userAgent)).toBe(Platform.IOS);
  });

  it('should detect Android from Android user agent', () => {
    const userAgent = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/108.0.0.0 Mobile Safari/537.36';
    expect(detectPlatform(userAgent)).toBe(Platform.ANDROID);
  });

  it('should return WEB for desktop browsers', () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/108.0.0.0 Safari/537.36';
    expect(detectPlatform(userAgent)).toBe(Platform.WEB);
  });

  it('should return WEB for empty user agent', () => {
    expect(detectPlatform('')).toBe(Platform.WEB);
  });
});

describe('parseQueryParams', () => {
  it('should parse query parameters from URL', () => {
    const url = 'https://example.com/refer?referralCode=ABC123&source=email';
    const params = parseQueryParams(url);
    
    expect(params.referralCode).toBe('ABC123');
    expect(params.source).toBe('email');
  });

  it('should return empty object for URL without params', () => {
    const url = 'https://example.com/refer';
    const params = parseQueryParams(url);
    
    expect(Object.keys(params).length).toBe(0);
  });

  it('should handle URL-encoded values', () => {
    const url = 'https://example.com/refer?name=John%20Doe&email=test%40example.com';
    const params = parseQueryParams(url);
    
    expect(params.name).toBe('John Doe');
    expect(params.email).toBe('test@example.com');
  });
});

describe('buildDeepLink', () => {
  it('should build deep link with params', () => {
    const link = buildDeepLink('myapp', 'refer', { code: 'ABC123', source: 'email' });
    expect(link).toBe('myapp://refer?code=ABC123&source=email');
  });

  it('should build deep link without params', () => {
    const link = buildDeepLink('myapp', 'home', {});
    expect(link).toBe('myapp://home');
  });

  it('should encode special characters in params', () => {
    const link = buildDeepLink('myapp', 'refer', { name: 'John Doe', email: 'test@example.com' });
    expect(link).toContain('name=John%20Doe');
    expect(link).toContain('email=test%40example.com');
  });
});
