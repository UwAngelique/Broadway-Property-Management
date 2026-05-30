"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLanguage } from "@/components/i18n/language-provider";
import { LiveVacancyBanner } from "@/components/marketing/live-vacancy-banner";

const FEATURE_KEYS = [
  "landing.feature1",
  "landing.feature2",
  "landing.feature3",
  "landing.feature4",
  "landing.feature5",
  "landing.feature6",
] as const;

export function MarketingLanding() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Image src="/broadway-logo.png" alt="Broadway Creation" width={130} height={52} className="h-auto w-[130px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-700">
            <Link href="/pricing" className="hover:text-gray-900">
              {t("landing.navPricing")}
            </Link>
            <Link href="/about" className="hover:text-gray-900">
              {t("landing.navAbout")}
            </Link>
            <Link href="/contact" className="hover:text-gray-900">
              {t("landing.navContact")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black">
              {t("auth.signIn")}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.2), transparent 40%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">{t("landing.heroEyebrow")}</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">{t("landing.heroTitle")}</h1>
            <p className="mt-4 text-base md:text-lg text-slate-200 max-w-xl">{t("landing.heroSubtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-white text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-100"
              >
                {t("landing.ctaTrial")}
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-white/40 px-6 py-3 text-sm font-medium hover:bg-white/10"
              >
                {t("landing.ctaPricing")}
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {t("landing.heroBullet1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {t("landing.heroBullet2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {t("landing.heroBullet3")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {t("landing.heroBullet4")}
              </li>
            </ul>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-6 backdrop-blur max-w-sm w-full">
              <Image
                src="/broadway-logo.png"
                alt=""
                width={280}
                height={140}
                className="w-full h-auto brightness-0 invert opacity-95"
              />
              <p className="mt-4 text-sm text-slate-200 text-center">{t("landing.heroCard")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t("landing.featuresTitle")}</h2>
          <p className="mt-3 text-gray-600">{t("landing.featuresSubtitle")}</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_KEYS.map((key) => (
            <article key={key} className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{t(key)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white border-y">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-16">
          <LiveVacancyBanner />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold">{t("landing.trustTitle")}</h2>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">{t("landing.trustBody")}</p>
          </div>
          <ul className="space-y-3 text-sm text-slate-200">
            <li>• {t("landing.trust1")}</li>
            <li>• {t("landing.trust2")}</li>
            <li>• {t("landing.trust3")}</li>
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t("landing.bottomTitle")}</h2>
        <p className="mt-2 text-gray-600 max-w-xl mx-auto">{t("landing.bottomSubtitle")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-lg bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-black">
            {t("landing.ctaTrial")}
          </Link>
          <Link href="/pricing" className="rounded-lg border px-6 py-3 text-sm hover:bg-white">
            {t("landing.ctaPricing")}
          </Link>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Broadway Creation · Powered By Realtimeteck ltd</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-gray-800">
              {t("landing.navAbout")}
            </Link>
            <Link href="/contact" className="hover:text-gray-800">
              {t("landing.navContact")}
            </Link>
            <Link href="/login" className="hover:text-gray-800">
              {t("auth.signIn")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
