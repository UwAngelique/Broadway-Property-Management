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
  | "auth.signInWithEmail"
  | "auth.signingIn"
  | "auth.creatingAccount"
  | "auth.sendSmsCode"
  | "auth.verifyAndSignIn"
  | "auth.phoneRwanda"
  | "auth.phonePlaceholder"
  | "auth.otpPlaceholder"
  | "auth.requestPasswordReset"
  | "auth.submitting"
  | "auth.resetting"
  | "auth.resetPasswordBtn"
  | "auth.resetToken"
  | "auth.newPassword"
  | "auth.yourEmail"
  | "auth.workspaceName"
  | "auth.passwordHint"
  | "auth.selectedPlan"
  | "auth.usernameNote"
  | "auth.chooseNewPassword"
  | "auth.resetStarted"
  | "auth.passwordResetSuccess"
  | "auth.appTitle"
  | "auth.choosePlan"
  | "auth.planIntro"
  | "auth.createWorkspace"
  | "auth.offlinePlans"
  | "auth.andMore"
  | "auth.smsSent"
  | "landing.navPricing"
  | "landing.navAbout"
  | "landing.navContact"
  | "landing.heroEyebrow"
  | "landing.heroTitle"
  | "landing.heroSubtitle"
  | "landing.heroCard"
  | "landing.heroBullet1"
  | "landing.heroBullet2"
  | "landing.heroBullet3"
  | "landing.heroBullet4"
  | "landing.ctaTrial"
  | "landing.ctaPricing"
  | "landing.featuresTitle"
  | "landing.featuresSubtitle"
  | "landing.feature1"
  | "landing.feature2"
  | "landing.feature3"
  | "landing.feature4"
  | "landing.feature5"
  | "landing.feature6"
  | "landing.vacanciesLabel"
  | "landing.vacanciesTitle"
  | "landing.vacanciesLoading"
  | "landing.vacanciesEmptyTitle"
  | "landing.vacanciesEmptyBody"
  | "landing.vacanciesCta"
  | "landing.vacanciesAdvertise"
  | "landing.vacanciesPerMonth"
  | "landing.trustTitle"
  | "landing.trustBody"
  | "landing.trust1"
  | "landing.trust2"
  | "landing.trust3"
  | "landing.bottomTitle"
  | "landing.bottomSubtitle"
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
