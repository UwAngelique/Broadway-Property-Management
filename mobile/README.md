# Broadway PM — Mobile (iOS & Android)

Expo app for **App Store** and **Google Play**, using the same API as [broadwaycreation.rw](http://broadwaycreation.rw).

## Quick start

```bash
cd mobile
cp .env.example .env
npm install
npm run generate-assets
npm start
```

## Store release

Full checklist: **[docs/APP_STORE_RELEASE.md](../docs/APP_STORE_RELEASE.md)**

```bash
npm install -g eas-cli
eas login
cd mobile
eas init
eas build --platform all --profile production
eas submit --platform all --profile production --latest
```

Listing copy: [store/PLAY_STORE_LISTING.md](../store/PLAY_STORE_LISTING.md)

## Configuration

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | API base including `/api` |
| `EXPO_PUBLIC_PRIVACY_URL` | Privacy policy (store requirement) |
| `EAS_PROJECT_ID` | From `eas init` |

Production defaults point to `http://broadwaycreation.rw/api` until HTTPS is enabled.

## Bundle identifiers

- iOS: `rw.broadwaycreation.pm`
- Android: `rw.broadwaycreation.pm`
