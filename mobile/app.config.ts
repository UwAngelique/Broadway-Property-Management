import type { ExpoConfig } from "expo/config";

// TODO: switch these defaults to https after SSL is active on production.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://broadwaycreation.rw/api";
const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL ?? "http://broadwaycreation.rw/legal/privacy";
const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL ?? "http://broadwaycreation.rw/legal/terms";

const config: ExpoConfig = {
  name: "Broadway PM",
  slug: "broadway-pm",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "broadwaypm",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0f172a",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "rw.broadwaycreation.pm",
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        "Broadway PM uses the camera to capture payment proofs and property photos.",
      NSPhotoLibraryUsageDescription:
        "Broadway PM accesses photos you choose to upload as payment or lease documents.",
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: "rw.broadwaycreation.pm",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0f172a",
    },
    permissions: ["INTERNET"],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
    ],
  },
  web: {
    favicon: "./assets/icon.png",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  extra: {
    apiUrl,
    privacyUrl,
    termsUrl,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};

export default config;
