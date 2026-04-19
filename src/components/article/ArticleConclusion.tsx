import { useTranslations } from "next-intl";

interface ArticleConclusionProps {
  summary?: string;
  points?: string[];
}

export function ArticleConclusion({
  summary,
  points,
}: ArticleConclusionProps) {
  const t = useTranslations("guides.template.conclusion");
  const hasSummary = typeof summary === "string" && summary.trim().length > 0;
  const normalizedPoints = points?.filter((point) => point.trim().length > 0) ?? [];

  if (!hasSummary && normalizedPoints.length === 0) return null;

  return (
    <section
      id="template-conclusion"
      aria-labelledby="template-conclusion-heading"
      className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6"
    >
      <h2 id="template-conclusion-heading" className="text-lg font-bold">
        {t("title")}
      </h2>
      {hasSummary ? (
        <p className="mt-3 text-sm leading-6 text-foreground/85">{summary}</p>
      ) : null}
      {normalizedPoints.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/85">
          {normalizedPoints.map((point) => (
            <li key={point} className="ml-4 list-disc pl-1">
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
