"use client";

import { LOCALE_OPTIONS } from "@/i18n";
import { useLanguage } from "./language-provider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t, setLocale } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-600 shrink-0">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => void setLocale(e.target.value as typeof locale)}
        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
        aria-label={t("language.label")}
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.locale} value={opt.locale}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
