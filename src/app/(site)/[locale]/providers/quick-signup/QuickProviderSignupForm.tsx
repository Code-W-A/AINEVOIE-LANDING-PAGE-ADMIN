"use client";

import {
  trackMetaCustomEvent,
  trackMetaStandardEvent,
} from "@/components/analytics/MetaPixel";
import { Link, useRouter } from "@/i18n/navigation";
import {
  getDefaultProviderServiceTypeItems,
  type ProviderServiceTypeItem,
} from "@/lib/providerServiceTypes";
import ProviderAppPreview from "@/components/ProviderAppPreview";
import { isValidPhoneNumber } from "libphonenumber-js";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

type CityOption = {
  countyCode: string;
  code: string;
  name: string;
};

type QuickProviderSignupFormProps = {
  counties: readonly { code: string; name: string }[];
  cities: CityOption[];
};

type ApiResponse = {
  error?: string;
  status?: string;
  uid?: string;
};

const FALLBACK_SERVICE_TYPES = getDefaultProviderServiceTypeItems();
const ORADEA_CITY_CODE = "26564";

export default function QuickProviderSignupForm({
  counties,
  cities,
}: QuickProviderSignupFormProps) {
  const locale = useLocale() as "ro" | "en";
  const t = useTranslations("QuickProviderSignup");
  const router = useRouter();
  const [serviceTypes, setServiceTypes] = useState<ProviderServiceTypeItem[]>(
    FALLBACK_SERVICE_TYPES,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countyCode, setCountyCode] = useState("BH");
  const [cityCode, setCityCode] = useState(
    cities.some((city) => city.code === ORADEA_CITY_CODE)
      ? ORADEA_CITY_CODE
      : "",
  );
  const [serviceType, setServiceType] = useState(
    FALLBACK_SERVICE_TYPES[0]?.value || "",
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = useMemo(
    () =>
      serviceTypes.map((item) => ({
        label: item.labels[locale] || item.labels.ro || item.value,
        value: item.value,
      })),
    [locale, serviceTypes],
  );
  const cityOptions = useMemo(
    () => cities.filter((city) => city.countyCode === countyCode),
    [cities, countyCode],
  );

  function handleCountyChange(nextCountyCode: string) {
    setCountyCode(nextCountyCode);
    setCityCode("");
  }

  useEffect(() => {
    trackMetaCustomEvent(
      "ProviderQuickSignupStarted",
      "provider-quick-signup-started:" + locale,
      { content_name: "Provider quick signup", locale },
    );
  }, [locale]);

  useEffect(() => {
    let active = true;

    async function loadServiceTypes() {
      try {
        const response = await fetch("/api/provider-service-types", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json();
        const items = Array.isArray(data?.item?.items)
          ? (data.item.items as ProviderServiceTypeItem[])
          : [];
        if (!active || !items.length) return;
        setServiceTypes(items);
        setServiceType((current) =>
          items.some((item) => item.value === current)
            ? current
            : items[0].value,
        );
      } catch {
        // The built-in service list remains available if the request fails.
      }
    }

    void loadServiceTypes();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone ||
      !password ||
      !countyCode ||
      !cityCode ||
      !serviceType ||
      !acceptTerms
    ) {
      setError(t("requiredError"));
      return;
    }
    if (!cityOptions.some((city) => city.code === cityCode)) {
      setError(t("requiredError"));
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setError(t("phoneError"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordError"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatchError"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/providers/onboarding", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-next-intl-locale": locale,
        },
        body: JSON.stringify({
          acceptTerms: true,
          cityCode,
          countyCode,
          email: email.trim(),
          fullName: fullName.trim(),
          legalStatus: "need_guidance",
          locale,
          newsletterOptIn: false,
          launchContactConsent: false,
          password,
          phone,
          serviceType,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.uid) {
        throw new Error(data.error || t("genericError"));
      }

      trackMetaStandardEvent("Lead", "provider-quick-lead:" + data.uid, {
        city_code: cityCode,
        county_code: countyCode,
        content_name: "Provider quick signup",
        locale,
        service_type: serviceType,
      });
      router.push("/providers/quick-signup/success");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t("genericError"),
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
      <div className="pt-2">
        <span className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </span>
        <h1 className="mt-4 text-4xl leading-tight font-bold text-black sm:text-5xl dark:text-white">
          {t("title")}
        </h1>
        <p className="text-body mt-5 max-w-[560px] text-lg leading-8">
          {t("description")}
        </p>

        <ProviderAppPreview
          locale={locale}
          labels={{
            requests: t("previewRequests"),
            calendar: t("previewCalendar"),
            reviews: t("previewReviews"),
          }}
        />

        <div className="mt-8 space-y-4">
          {(["benefit1", "benefit2", "benefit3"] as const).map((key) => (
            <div key={key} className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-body text-sm leading-6">{t(key)}</p>
            </div>
          ))}
        </div>

        <div className="border-primary/20 bg-primary/5 mt-8 flex items-start gap-3 rounded-xl border p-4">
          <Sparkles className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium text-black dark:text-white">
            {t("timeNote")}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shadow-card dark:bg-dark dark:shadow-card-dark rounded-2xl bg-white p-6 sm:p-8"
      >
        <div className="mb-7 flex items-start gap-3">
          <div className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
            <ShieldCheck className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              {t("formTitle")}
            </h2>
            <p className="text-body mt-1 text-sm">{t("formDescription")}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("fullName")}
            </span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              placeholder={t("fullNamePlaceholder")}
              disabled={submitting}
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("email")}
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              placeholder={t("emailPlaceholder")}
              disabled={submitting}
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("phone")}
            </span>
            <PhoneInput
              international
              defaultCountry="RO"
              value={phone || undefined}
              onChange={(value) => setPhone(value || "")}
              disabled={submitting}
              className="border-stroke dark:border-stroke-dark focus-within:border-primary min-h-[50px] rounded-md border bg-transparent px-4"
              numberInputProps={{
                className: "w-full bg-transparent py-3 outline-none",
                required: true,
              }}
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("county")}
            </span>
            <select
              value={countyCode}
              onChange={(event) => handleCountyChange(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              disabled={submitting}
              required
            >
              {counties.map((county) => (
                <option key={county.code} value={county.code}>
                  {county.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("city")}
            </span>
            <select
              value={cityCode}
              onChange={(event) => setCityCode(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              disabled={submitting}
              required
            >
              <option value="" disabled>
                {t("cityPlaceholder")}
              </option>
              {cityOptions.map((city) => (
                <option key={city.code} value={city.code}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("service")}
            </span>
            <select
              value={serviceType}
              onChange={(event) => setServiceType(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              disabled={submitting}
              required
            >
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("password")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              placeholder={t("passwordPlaceholder")}
              minLength={8}
              disabled={submitting}
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t("confirmPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="border-stroke dark:border-stroke-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 outline-none"
              placeholder={t("confirmPasswordPlaceholder")}
              minLength={8}
              disabled={submitting}
              required
            />
          </label>
        </div>

        <label className="mt-6 flex items-start gap-3">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            disabled={submitting}
            className="accent-primary mt-1 h-4 w-4 shrink-0"
          />
          <span className="text-body text-sm leading-6">
            {t("termsBefore")}{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-primary hover:underline"
            >
              {t("terms")}
            </Link>{" "}
            {t("termsAnd")}{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-primary hover:underline"
            >
              {t("privacy")}
            </Link>
            {t("termsAfter")}
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? t("submitting") : t("submit")}
        </button>
        <p className="text-body mt-4 text-center text-xs">{t("submitNote")}</p>
      </form>
    </div>
  );
}
