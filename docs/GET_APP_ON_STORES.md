# How users can download Broadway PM (App Store & Google Play)

This guide gets your app **listed and downloadable** using the **Broadway Creation** logo from the website (`frontend/public/broadway-logo.png`).

---

## Before you start

| Requirement | Cost | Link |
|-------------|------|------|
| **Apple Developer Program** (iOS) | $99 / year | https://developer.apple.com/programs/ |
| **Google Play developer account** (Android) | $25 one-time | https://play.google.com/console/signup |
| **Expo account** (free) | Free | https://expo.dev/signup |
| **Privacy policy live** | — | http://broadwaycreation.rw/legal/privacy |

---

## Step 1 — Use the correct app icon (Broadway Creation logo)

On your computer, in the project folder:

```bash
cd mobile
npm install
npm run generate-assets
```

This reads **`frontend/public/broadway-logo.png`** (same as the website) and creates:

- `mobile/assets/icon.png` — App Store icon  
- `mobile/assets/adaptive-icon.png` — Google Play icon  
- `mobile/assets/splash.png` — launch screen  

Commit and push if you change icons, then rebuild with EAS (Step 4).

---

## Step 2 — Install EAS and register the app

```bash
npm install -g eas-cli
eas login
cd mobile
eas init
```

- Choose **Expo** account when asked.  
- `eas init` links the project and adds a **project ID** to your Expo dashboard.  
- App name in stores: **Broadway PM**  
- Bundle ID (iOS) / package (Android): **`rw.broadwaycreation.pm`** (already in `app.config.ts`)

---

## Step 3 — Apple: create the App Store listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** → **New App**.  
2. Fill in:
   - **Platform:** iOS  
   - **Name:** Broadway PM  
   - **Primary language:** English  
   - **Bundle ID:** `rw.broadwaycreation.pm` (create under [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) if missing)  
   - **SKU:** `broadway-pm-001`  
3. Open the new app → **App Information**:
   - **Privacy Policy URL:** `http://broadwaycreation.rw/legal/privacy`  
   - **Category:** Business  
4. **Pricing:** Free (or set price).  
5. Copy description from `store/PLAY_STORE_LISTING.md`.  
6. **App Review Information** → demo account:
   - Email: `platform@broadway.demo`  
   - Password: `Demo2026!`  
7. **Screenshots** (required): run the app in iOS Simulator, capture login + dashboard (6.7" iPhone size).  

Put your **Apple Team ID** in `mobile/eas.json`:

```json
"appleTeamId": "YOUR_10_CHAR_TEAM_ID"
```

(Find it under Apple Developer → Membership.)

---

## Step 4 — Google Play: create the store listing

1. [Google Play Console](https://play.google.com/console) → **Create app**.  
2. **App name:** Broadway PM  
3. **Default language:** English  
4. Complete **Dashboard** tasks (required before publish):
   - **Privacy policy:** `http://broadwaycreation.rw/legal/privacy`  
   - **App access:** provide demo login (`platform@broadway.demo` / `Demo2026!`)  
   - **Ads:** No ads (unless you add them)  
   - **Content rating:** start questionnaire → business app, low risk  
   - **Target audience:** 18+  
   - **Data safety:** declare email, property/financial data users enter  
   - **Store listing:** short + full description from `store/PLAY_STORE_LISTING.md`  
   - **Graphics:** upload `mobile/assets/icon.png` as hi-res icon; add phone screenshots  

5. **Release** → **Testing** → **Internal testing** (recommended first).  
6. For automated upload, create a **Google Cloud service account** and save JSON as `mobile/google-play-service-account.json` (see `docs/APP_STORE_RELEASE.md`).

---

## Step 5 — Build the installable apps (cloud build)

From `mobile/`:

```bash
# First time: test Android APK on your phone (optional)
eas build --platform android --profile preview

# Store builds (upload these to Apple & Google)
eas build --platform all --profile production
```

- Builds run on Expo servers (~15–25 minutes each).  
- When finished, EAS shows download links for `.ipa` (iOS) and `.aab` (Android).  
- Production build uses API: `http://broadwaycreation.rw/api`

---

## Step 6 — Submit for review

### iOS

```bash
cd mobile
eas submit --platform ios --profile production --latest
```

Then in **App Store Connect** → your app → **iOS App** → select the build → **Submit for Review**.

### Android

```bash
eas submit --platform android --profile production --latest
```

Then in Play Console → **Internal testing** (or Production) → **Create release** → the uploaded bundle appears → **Review and roll out**.

---

## Step 7 — When approved, users download here

| Platform | Where users get the app |
|----------|-------------------------|
| **iPhone / iPad** | App Store → search **Broadway PM** |
| **Android** | Google Play → search **Broadway PM** |

You can also share direct store links after publish:

- Apple: App Store Connect → app → **View on App Store** (link appears after approval)  
- Google: Play Console → **Store presence** → store URL  

Optional: add “Download on the App Store / Google Play” buttons on `broadwaycreation.rw` (badge images from Apple/Google brand guidelines).

---

## Step 8 — Updates (new versions)

1. Bump version in `mobile/app.config.ts` (`version` and iOS `buildNumber` / Android `versionCode`).  
2. `npm run generate-assets` if the logo changed.  
3. `eas build --platform all --profile production`  
4. `eas submit --platform all --profile production --latest`  

---

## Checklist (print this)

- [ ] `npm run generate-assets` (Broadway Creation logo)  
- [ ] Apple Developer enrolled  
- [ ] Google Play developer account created  
- [ ] `eas init` completed  
- [ ] App Store Connect app created (`rw.broadwaycreation.pm`)  
- [ ] Play Console app created  
- [ ] Screenshots uploaded (both stores)  
- [ ] Privacy policy URL set (both stores)  
- [ ] `eas build --platform all --profile production` succeeded  
- [ ] `eas submit` for iOS and Android  
- [ ] Submitted for review  

---

## Help

- Technical detail: [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md)  
- Listing text: [store/PLAY_STORE_LISTING.md](../store/PLAY_STORE_LISTING.md)  
- Support email for stores: `support@broadwaycreation.rw`
