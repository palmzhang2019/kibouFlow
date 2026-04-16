import { useTranslations } from "next-intl";
import { Section } from "@/components/shared/Section";

export function AudienceSection() {
  const t = useTranslations("home.audience");

  const suitableItems = [0, 1, 2, 3].map((i) => t(`suitable.items.${i}`));
  const notSuitableItems = [0, 1, 2].map((i) => t(`notSuitable.items.${i}`));

  return (
    <Section>
      <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("title")}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Suitable */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary-light/30 p-6">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("suitable.title")}
          </h3>
          <ul className="mt-4 space-y-3">
            {suitableItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not suitable */}
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
          <h3 className="text-lg font-semibold text-muted flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {t("notSuitable.title")}
          </h3>
          <ul className="mt-4 space-y-3">
            {notSuitableItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
