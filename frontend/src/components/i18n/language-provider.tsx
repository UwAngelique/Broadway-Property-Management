"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiToLocale,
  localeToApi,
  translate,
  type ApiLanguage,
  type AppLocale,
  type TranslationKey,
} from "@/i18n";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

const LOCALE_KEY = "pm_locale";

type LanguageContextValue = {
  locale: AppLocale;
  apiLanguage: ApiLanguage;
  t: (key: TranslationKey) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCALE_KEY);
  if (!raw) return null;
  const allowed = ["en", "fr", "rw", "sw", "es", "nl", "zh"] as const;
  return allowed.includes(raw as AppLocale) ? (raw as AppLocale) : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocaleState(stored);
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    const token = getToken();
    if (token) {
      try {
        await apiRequest("/auth/me/language", {
          method: "PATCH",
          body: JSON.stringify({ language: localeToApi(next) }),
        });
      } catch {
        /* offline or guest — local preference still applies */
      }
    }
  }, []);

  const applyApiLanguage = useCallback((api?: string | null) => {
    const next = apiToLocale(api);
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      apiLanguage: localeToApi(locale),
      t: (key) => translate(locale, key),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      <LanguageSyncBridge onApiLanguage={applyApiLanguage} />
      {children}
    </LanguageContext.Provider>
  );
}

/** Lets sync provider push server language without circular imports. */
const apiLangListeners = new Set<(api: string | null) => void>();

export function notifyLanguageFromSync(api: string | null) {
  apiLangListeners.forEach((fn) => fn(api));
}

function LanguageSyncBridge({ onApiLanguage }: { onApiLanguage: (api: string | null) => void }) {
  useEffect(() => {
    apiLangListeners.add(onApiLanguage);
    return () => {
      apiLangListeners.delete(onApiLanguage);
    };
  }, [onApiLanguage]);
  return null;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
