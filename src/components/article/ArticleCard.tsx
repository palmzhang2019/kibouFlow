import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ArticleMeta, Category } from "@/lib/content";

interface ArticleCardProps {
  article: ArticleMeta;
}

const categoryColors: Record<Category, string> = {
  problems: "bg-amber-100 text-amber-800",
  paths: "bg-blue-100 text-blue-800",
  boundaries: "bg-emerald-100 text-emerald-800",
  cases: "bg-purple-100 text-purple-800",
};

export function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations("guides");

  return (
    <Link
      href={article.href}
      className="group block rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
    >
      <span
        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[article.category]}`}
      >
        {t(`categories.${article.category}`)}
      </span>
      <h3 className="mt-3 text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-muted line-clamp-3">
        {article.description}
      </p>
      <span className="mt-4 inline-block text-sm font-medium text-primary">
        {t("readMore")} →
      </span>
    </Link>
  );
}
