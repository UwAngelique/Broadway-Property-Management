# App Store & Google Play release guide

Mobile app path: `mobile/` (Expo SDK 52 + EAS Build).

**Bundle IDs**

| Store | Identifier |
|-------|------------|
| iOS | `rw.broadwaycreation.pm` |
| Android | `rw.broadwaycreation.pm` |

**Required public URLs** (already on your site)

- Privacy: http://broadwaycreation.rw/legal/privacy  
- Terms: http://broadwaycreation.rw/legal/terms  
- Support email: support@broadwaycreation.rw (update in store consoles)

---

## Phase 1 — One-time setup (your machine)

### 1. Install tools

```bash
npm install -g eas-cli
```

Log in:

```bash
eas login
```

### 2. Link Expo project

```bash
cd mobile
npm install
npm run generate-assets
eas init
```

`eas init` creates an Expo project and writes `extra.eas.projectId` into `app.config.ts` (or set `EAS_PROJECT_ID` in `.env`).

### 3. Apple Developer Program ($99/year)

1. Enroll at [developer.apple.com](https://developer.apple.com/programs/).  
2. Create an **App ID** with bundle ID `rw.broadwaycreation.pm`.  
3. In **App Store Connect** → **My Apps** → **+** → New App:  
   - Name: **Broadway PM**  
   - Bundle ID: `rw.broadwaycreation.pm`  
   - SKU: `broadway-pm-001`  
4. Note your **Apple Team ID** → put in `mobile/eas.json` under `submit.production.ios.appleTeamId`.

### 4. Google Play Console ($25 one-time)

1. [play.google.com/console](https://play.google.com/console) → Create developer account.  
2. **Create app** → Broadway PM → default language English.  
3. Complete **App content** (privacy policy URL, ads declaration, content rating questionnaire).  
4. Create a **service account** for automated upload:  
   - Google Cloud Console → IAM → Service account → Create key (JSON).  
   - Play Console → Setup → API access → Link project → Grant **Release manager** to the service account.  
   - Save JSON as `mobile/google-play-service-account.json` (gitignored).

---

## Phase 2 — Build store binaries

From `mobile/`:

```bash
# Internal test builds first (APK for Android, simulator optional for iOS)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Production builds for stores
eas build --platform all --profile production
```

Production profile sets:

- `EXPO_PUBLIC_API_URL=http://broadwaycreation.rw/api`

When you enable HTTPS, update `mobile/eas.json` and `app.config.ts` to `https://broadwaycreation.rw/api`.

---

## Phase 3 — Submit to stores

### iOS (App Store Connect)

```bash
cd mobile
eas submit --platform ios --profile production --latest
```

Then in App Store Connect:

| Section | What to enter |
|---------|----------------|
| **Privacy Policy URL** | http://broadwaycreation.rw/legal/privacy |
| **Category** | Business or Productivity |
| **Age rating** | 4+ (no restricted content) |
| **Encryption** | No (ITSAppUsesNonExemptEncryption = false in app) |
| **Screenshots** | 6.7" and 5.5" iPhone (use simulator or device) |
| **Description** | See `store/PLAY_STORE_LISTING.md` |
| **Demo account** | platform@broadway.demo / Demo2026! (for Apple review) |

**App Privacy (nutrition labels)** — declare roughly:

- Contact info (email) — account creation  
- Financial info — payment proofs (user-provided)  
- Data linked to user — yes (account)  
- Not used for tracking  

### Android (Google Play)

```bash
eas submit --platform android --profile production --latest
```

Play Console checklist:

- **Privacy policy** URL (required)  
- **Data safety** form: account data, property/lease data, optional phone for OTP  
- **Content rating** → start questionnaire (business app, no violence)  
- **Store listing** → see `store/PLAY_STORE_LISTING.md`  
- **Internal testing** track first, then **Production**

---

## Phase 4 — Africa's Talking / Microsoft (optional, same as web)

Mobile uses the same API — no extra mobile keys. Phone OTP works once `AFRICASTALKING_*` is set on the **server** `backend/.env`.

---

## Phase 5 — After approval

1. Switch API URL to HTTPS in `eas.json` production env.  
2. Rebuild: `eas build --platform all --profile production`.  
3. Submit updates: `eas submit --platform all --profile production --latest`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `projectId` missing | Run `eas init` in `mobile/` |
| iOS provisioning | EAS manages credentials: `eas credentials` |
| Android signing | EAS manages keystore on first build |
| API network error on device | Use production API URL with `/api` suffix; allow HTTP cleartext only until HTTPS (Android may need `usesCleartextTraffic` — add `expo-build-properties` if required) |
| Rejected for “minimal functionality” | Ensure hub tiles open Finance/Tax/Clients; demo login works |

---

## Store listing copy

Ready-to-paste text: [store/PLAY_STORE_LISTING.md](../store/PLAY_STORE_LISTING.md)
