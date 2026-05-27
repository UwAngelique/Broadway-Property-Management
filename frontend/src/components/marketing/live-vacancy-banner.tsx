"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/components/i18n/language-provider";

type PublicListing = {
  id: number;
  title: string;
  description: string | null;
  locationLabel: string | null;
  rentRwf: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export function LiveVacancyBanner() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiRequest<PublicListing[]>("/listings/public?limit=8")
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-8 text-center text-sm text-gray-500">
        {t("landing.vacanciesLoading")}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 md:p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("landing.vacanciesLabel")}</p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">{t("landing.vacanciesEmptyTitle")}</h3>
        <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">{t("landing.vacanciesEmptyBody")}</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-lg bg-emerald-800 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-900"
        >
          {t("landing.vacanciesCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("landing.vacanciesLabel")}</p>
          <h3 className="text-xl font-semibold text-gray-900">{t("landing.vacanciesTitle")}</h3>
        </div>
        <Link href="/contact" className="text-sm font-medium text-emerald-800 underline hover:text-emerald-900">
          {t("landing.vacanciesAdvertise")}
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-300 transition-colors"
          >
            <h4 className="font-semibold text-gray-900">{item.title}</h4>
            {item.locationLabel ? <p className="text-xs text-gray-500 mt-1">{item.locationLabel}</p> : null}
            {item.rentRwf != null ? (
              <p className="mt-2 text-sm font-medium text-emerald-900">
                {item.rentRwf.toLocaleString()} RWF
                <span className="text-gray-500 font-normal"> / {t("landing.vacanciesPerMonth")}</span>
              </p>
            ) : null}
            {item.description ? <p className="mt-2 text-xs text-gray-600 line-clamp-3">{item.description}</p> : null}
            {(item.contactPhone || item.contactEmail) && (
              <p className="mt-3 text-xs text-gray-500">
                {item.contactPhone ?? item.contactEmail}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
