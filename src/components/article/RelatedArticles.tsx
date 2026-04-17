import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArticleMeta, Category } from "@/lib/content";

interface RelatedArticlesProps {
  articles: ArticleMeta[];
}

const categoryColors: Record<Category, string> = {
  problems: "bg-amber-100 text-amber-800",
  paths: "bg-blue-100 text-blue-800",
  boundaries: "bg-emerald-100 text-emerald-800",
  cases: "bg-purple-100 text-purple-800",
};

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  const t = useTranslations("guides");

  if (articles.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">{t("relatedArticles")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="group block rounded-lg border border-gray-100 p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${categoryColors[article.category]}`}
            >
              {article.contentType
                ? t(`contentTypes.${article.contentType}`)
                : t(`categories.${article.category}`)}
            </span>
            <h3 className="mt-2 text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {article.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
