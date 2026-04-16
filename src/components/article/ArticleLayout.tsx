import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Article, ArticleMeta, Category } from "@/lib/content";
import { Breadcrumb } from "./Breadcrumb";
import { AudienceBlock } from "./AudienceBlock";
import { ArticleCTA } from "./ArticleCTA";
import { RelatedArticles } from "./RelatedArticles";
import { TableOfContents } from "./TableOfContents";

const categoryColors: Record<Category, string> = {
  problems: "bg-amber-100 text-amber-800",
  paths: "bg-blue-100 text-blue-800",
  boundaries: "bg-emerald-100 text-emerald-800",
  cases: "bg-purple-100 text-purple-800",
};

interface ArticleLayoutProps {
  article: Article;
  relatedArticles: ArticleMeta[];
  children: React.ReactNode; // rendered MDX
}

export function ArticleLayout({
  article,
  relatedArticles,
  children,
}: ArticleLayoutProps) {
  const t = useTranslations("guides");

  return (
    <article className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Breadcrumb category={article.category} title={article.title} />

        <div className="mt-6">
          <span
            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[article.category]}`}
          >
            {t(`categories.${article.category}`)}
          </span>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          {article.title}
        </h1>

        <p className="mt-3 text-muted text-sm">
          {t("publishedAt")} {article.publishedAt}
          {article.updatedAt &&
            article.updatedAt !== article.publishedAt &&
            ` · 更新于 ${article.updatedAt}`}
        </p>

        <div className="mt-10 flex gap-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div
              data-article-content
              className="prose prose-gray max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-a:text-primary"
            >
              {children}
            </div>

            <AudienceBlock
              suitableFor={article.suitableFor}
              notSuitableFor={article.notSuitableFor}
            />

            <ArticleCTA
              ctaType={article.ctaType}
              articleSlug={`${article.category}/${article.slug}`}
            />

            <RelatedArticles articles={relatedArticles} />

            <div className="mt-8">
              <Link
                href="/guides"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                ← {t("backToGuides")}
              </Link>
            </div>
          </div>

          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </article>
  );
}
