# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-02-03

### Added

- Generic deep link endpoint `/link` - handles ANY params
- Support for multiple link types: referral, profile, car, product, etc.
- Automatic path param merging for backward compatibility

### Changed

- `handleDeepLink()` now accepts any query/path params generically
- Updated documentation with multi-project examples

### Example URLs

```
https://rokart.in/link?type=referral&code=ABC123
https://speekfeed.in/link?type=profile&userId=456
https://ejaro.com/link?type=car&carId=789
```

## [1.1.1] - 2026-02-03

### Changed

- Updated documentation to clarify route structure must match SDK's `backendURL`
- Simplified example.ts to show core LinkIO method usage
- Added comments explaining API endpoint customization

## [1.1.0] - 2026-02-03

### Added

- Unit tests for `utils.ts` (11 tests)
- Unit tests for `InMemoryStorage.ts` (10 tests)
- Unit tests for `LinkIO.ts` (10 tests)
- Jest configuration with ts-jest
- Path parameter support for `/refer/:referralCode` route
- API versioning support (`/api/v1/` prefix)

### Changed

- Updated API endpoints to use `/api/v1/` prefix for mobile app compatibility
- Updated `handleDeepLink()` to support both path params and query params for referral code
- Improved documentation with correct GitHub URLs

### Fixed

- CI workflow now properly runs tests

## [1.0.0] - 2026-02-03

### Added

- Initial release
- LinkIO class with deep link handling
- Universal Links (iOS) support with AASA generation
- App Links (Android) support with assetlinks.json generation
- Platform detection (iOS, Android, Web)
- Deferred deep linking support
- Referral tracking system
- InMemoryStorage implementation
- TypeScript support with full type definitions
- GitHub Actions CI/CD workflows
