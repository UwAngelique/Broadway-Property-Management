# Broadway PM — Mobile (Expo)

React Native app for **iOS App Store** and **Google Play**, sharing the same API and WebSocket events as the web app.

## Setup

```bash
cd mobile
npm install
```

Set API URL in `app.json` → `extra.apiUrl` or:

```bash
set EXPO_PUBLIC_API_URL=https://your-api.ondigitalocean.app
```

## Run

```bash
npm start
```

## Store release (after production API is live)

1. Add `assets/icon.png`, `splash.png`, `adaptive-icon.png` (1024×1024 icon).
2. `eas build --platform all` (Expo Application Services).
3. Submit to App Store Connect and Google Play Console.
4. Privacy policy URL must match web `/legal/privacy`.
