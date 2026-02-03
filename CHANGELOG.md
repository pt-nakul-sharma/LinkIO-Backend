# Changelog

All notable changes to this project will be documented in this file.

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
