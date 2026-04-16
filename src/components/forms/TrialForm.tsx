"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTracking } from "@/components/tracking/TrackingProvider";
import { getStoredUTMParams } from "@/lib/utm";

export function TrialForm() {
  const t = useTranslations("trial");
  const locale = useLocale();
  const router = useRouter();
  const { trackFormStart, trackFormSubmit } = useTracking();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formStarted = useRef(false);

  function handleFocus() {
    if (!formStarted.current) {
      formStarted.current = true;
      trackFormStart("trial");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const utm = getStoredUTMParams();

    const data = {
      name: formData.get("name") as string,
      contact: formData.get("contact") as string,
      current_status: formData.get("current_status") as string,
      main_concern: formData.get("main_concern") as string,
      goal: formData.get("goal") as string,
      willing_followup: formData.get("willing_followup") === "yes",
      source_note: formData.get("source_note") as string,
      locale,
      ...utm,
    };

    try {
      const res = await fetch("/api/trial", {
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

      trackFormSubmit("trial");
      router.push("/trial/success");
    } catch {
      setError(t("error.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onFocus={handleFocus}>
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          {t("form.name")} <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder={t("form.namePlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
        />
      </div>

      {/* Contact */}
      <div>
        <label htmlFor="contact" className="block text-sm font-medium mb-1.5">
          {t("form.contact")} <span className="text-error">*</span>
        </label>
        <input
          id="contact"
          name="contact"
          type="text"
          required
          placeholder={t("form.contactPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
        />
      </div>

      {/* Current status */}
      <div>
        <label htmlFor="current_status" className="block text-sm font-medium mb-1.5">
          {t("form.currentStatus")}
        </label>
        <select
          id="current_status"
          name="current_status"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-white"
        >
          <option value="">{t("form.statusOptions.placeholder")}</option>
          <option value="student">{t("form.statusOptions.student")}</option>
          <option value="jobSeeking">{t("form.statusOptions.jobSeeking")}</option>
          <option value="working">{t("form.statusOptions.working")}</option>
          <option value="other">{t("form.statusOptions.other")}</option>
        </select>
      </div>

      {/* Main concern */}
      <div>
        <label htmlFor="main_concern" className="block text-sm font-medium mb-1.5">
          {t("form.mainConcern")}
        </label>
        <textarea
          id="main_concern"
          name="main_concern"
          rows={3}
          placeholder={t("form.mainConcernPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
        />
      </div>

      {/* Goal */}
      <div>
        <label htmlFor="goal" className="block text-sm font-medium mb-1.5">
          {t("form.goal")}
        </label>
        <textarea
          id="goal"
          name="goal"
          rows={3}
          placeholder={t("form.goalPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
        />
      </div>

      {/* Willing followup */}
      <fieldset>
        <legend className="block text-sm font-medium mb-1.5">
          {t("form.willingFollowup")}
        </legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="willing_followup" value="yes" defaultChecked className="accent-primary" />
            {t("form.yes")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="willing_followup" value="no" className="accent-primary" />
            {t("form.no")}
          </label>
        </div>
      </fieldset>

      {/* Source note */}
      <div>
        <label htmlFor="source_note" className="block text-sm font-medium mb-1.5">
          {t("form.sourceNote")}
        </label>
        <input
          id="source_note"
          name="source_note"
          type="text"
          placeholder={t("form.sourceNotePlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
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
