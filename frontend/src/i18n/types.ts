/** API / database language codes */
export type ApiLanguage = "EN" | "FR" | "RW" | "SW" | "ES" | "NL" | "ZH";

/** UI locale keys */
export type AppLocale = "en" | "fr" | "rw" | "sw" | "es" | "nl" | "zh";

export const API_LANGUAGES: ApiLanguage[] = ["EN", "FR", "RW", "SW", "ES", "NL", "ZH"];

export const LOCALE_OPTIONS: { api: ApiLanguage; locale: AppLocale; labelKey: TranslationKey }[] = [
  { api: "EN", locale: "en", labelKey: "language.english" },
  { api: "FR", locale: "fr", labelKey: "language.french" },
  { api: "RW", locale: "rw", labelKey: "language.kinyarwanda" },
  { api: "SW", locale: "sw", labelKey: "language.swahili" },
  { api: "ES", locale: "es", labelKey: "language.spanish" },
  { api: "NL", locale: "nl", labelKey: "language.dutch" },
  { api: "ZH", locale: "zh", labelKey: "language.chinese" },
];

export function apiToLocale(api?: string | null): AppLocale {
  const map: Record<string, AppLocale> = {
    EN: "en",
    FR: "fr",
    RW: "rw",
    SW: "sw",
    ES: "es",
    NL: "nl",
    ZH: "zh",
  };
  return map[api ?? "EN"] ?? "en";
}

export function localeToApi(locale: AppLocale): ApiLanguage {
  const map: Record<AppLocale, ApiLanguage> = {
    en: "EN",
    fr: "FR",
    rw: "RW",
    sw: "SW",
    es: "ES",
    nl: "NL",
    zh: "ZH",
  };
  return map[locale];
}

export type TranslationKey =
  | "nav.home"
  | "nav.clients"
  | "nav.finance"
  | "nav.tax"
  | "nav.operations"
  | "nav.settings"
  | "nav.properties"
  | "nav.units"
  | "nav.tenants"
  | "nav.leases"
  | "nav.payments"
  | "nav.expenses"
  | "nav.forecast"
  | "nav.team"
  | "nav.setup"
  | "nav.portal"
  | "nav.pay"
  | "auth.signIn"
  | "auth.signUp"
  | "auth.logout"
  | "auth.email"
  | "auth.password"
  | "auth.forgotPassword"
  | "sync.lastSynced"
  | "sync.syncing"
  | "sync.upToDate"
  | "language.label"
  | "language.english"
  | "language.french"
  | "language.kinyarwanda"
  | "language.swahili"
  | "language.spanish"
  | "language.dutch"
  | "language.chinese"
  | "common.loading";

export type MessageCatalog = Record<TranslationKey, string>;
