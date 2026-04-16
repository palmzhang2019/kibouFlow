import { useTranslations } from "next-intl";

interface AudienceBlockProps {
  suitableFor?: string[];
  notSuitableFor?: string[];
}

export function AudienceBlock({
  suitableFor,
  notSuitableFor,
}: AudienceBlockProps) {
  const t = useTranslations("home.audience");

  if (!suitableFor?.length && !notSuitableFor?.length) return null;

  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {suitableFor && suitableFor.length > 0 && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary-light/30 p-5">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("suitable.title")}
          </h3>
          <ul className="mt-3 space-y-2">
            {suitableFor.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {notSuitableFor && notSuitableFor.length > 0 && (
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            {t("notSuitable.title")}
          </h3>
          <ul className="mt-3 space-y-2">
            {notSuitableFor.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
