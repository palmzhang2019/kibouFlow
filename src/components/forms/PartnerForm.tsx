"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";
import { getStoredUTMParams } from "@/lib/utm";

export function PartnerForm() {
  const t = useTranslations("partner");
  const locale = useLocale();
  const router = useRouter();
  const { trackFormStart, trackFormSubmit } = useTracking();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formStarted = useRef(false);

  function handleFocus() {
    if (!formStarted.current) {
      formStarted.current = true;
      trackFormStart("partner");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const utm = getStoredUTMParams();

    const data = {
      org_name: formData.get("org_name") as string,
      contact_person: formData.get("contact_person") as string,
      contact_method: formData.get("contact_method") as string,
      org_type: formData.get("org_type") as string,
      cooperation_interest: formData.get("cooperation_interest") as string,
      locale,
      ...utm,
    };

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 429) {
        setError(t("error.tooManyRequests"));
        return;
      }

      if (!res.ok) {
        setError(t("error.submitFailed"));
        return;
      }

      trackFormSubmit("partner");
      router.push("/partner/success");
    } catch {
      setError(t("error.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onFocus={handleFocus}>
      {/* Org name */}
      <div>
        <label htmlFor="org_name" className="block text-sm font-medium mb-1.5">
          {t("form.orgName")} <span className="text-error">*</span>
        </label>
        <input
          id="org_name"
          name="org_name"
          type="text"
          required
          placeholder={t("form.orgNamePlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
        />
      </div>

      {/* Contact person */}
      <div>
        <label htmlFor="contact_person" className="block text-sm font-medium mb-1.5">
          {t("form.contactPerson")} <span className="text-error">*</span>
        </label>
        <input
          id="contact_person"
          name="contact_person"
          type="text"
          required
          placeholder={t("form.contactPersonPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
        />
      </div>

      {/* Contact method */}
      <div>
        <label htmlFor="contact_method" className="block text-sm font-medium mb-1.5">
          {t("form.contactMethod")} <span className="text-error">*</span>
        </label>
        <input
          id="contact_method"
          name="contact_method"
          type="text"
          required
          placeholder={t("form.contactMethodPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
        />
      </div>

      {/* Org type */}
      <div>
        <label htmlFor="org_type" className="block text-sm font-medium mb-1.5">
          {t("form.orgType")}
        </label>
        <select
          id="org_type"
          name="org_type"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white"
        >
          <option value="">{t("form.orgTypeOptions.placeholder")}</option>
          <option value="langSchool">{t("form.orgTypeOptions.langSchool")}</option>
          <option value="jobSupport">{t("form.orgTypeOptions.jobSupport")}</option>
          <option value="foreignSupport">{t("form.orgTypeOptions.foreignSupport")}</option>
          <option value="consultant">{t("form.orgTypeOptions.consultant")}</option>
          <option value="other">{t("form.orgTypeOptions.other")}</option>
        </select>
      </div>

      {/* Cooperation interest */}
      <div>
        <label htmlFor="cooperation_interest" className="block text-sm font-medium mb-1.5">
          {t("form.cooperationInterest")}
        </label>
        <textarea
          id="cooperation_interest"
          name="cooperation_interest"
          rows={4}
          placeholder={t("form.cooperationInterestPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary text-white py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t("form.submitting") : t("form.submit")}
      </button>
    </form>
  );
}
