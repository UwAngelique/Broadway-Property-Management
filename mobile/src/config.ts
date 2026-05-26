import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
};

export function getExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function getApiUrl() {
  return getExtra().apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "https://broadwaycreation.rw/api";
}

export function getPrivacyUrl() {
  return getExtra().privacyUrl ?? process.env.EXPO_PUBLIC_PRIVACY_URL ?? "http://broadwaycreation.rw/legal/privacy";
}

export function getTermsUrl() {
  return getExtra().termsUrl ?? process.env.EXPO_PUBLIC_TERMS_URL ?? "http://broadwaycreation.rw/legal/terms";
}
