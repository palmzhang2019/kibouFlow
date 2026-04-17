import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { ArticleCard } from "@/components/article/ArticleCard";
import {
  getAllArticles,
  CATEGORIES,
  getArticlesByContentType,
  getArticlesByCluster,
  CLUSTERS,
} from "@/lib/content";
import type { Category } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.guides" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "zh" ? "zh_CN" : "ja_JP",
    },
    alternates: {
      languages: { zh: "/zh/guides", ja: "/ja/guides" },
    },
  };
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  const allArticles = getAllArticles(locale);
  const clusterEntries = getArticlesByContentType(locale, "cluster");
  const faqEntries = getArticlesByContentType(locale, "faq");
  const frameworkEntries = getArticlesByContentType(locale, "framework");
  const conceptEntries = getArticlesByContentType(locale, "concept");
  const caseLibrary = allArticles.find((article) => article.slug === "case-library");

  const grouped = CATEGORIES.map((cat) => ({
    category: cat as Category,
    articles: allArticles.filter(
      (a) =>
        a.category === cat &&
        !["cluster", "faq", "framework", "concept"].includes(a.contentType || ""),
    ),
  })).filter((g) => g.articles.length > 0);

  return (
    <Section>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-14 space-y-14">
        {clusterEntries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("sections.clusters")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {clusterEntries.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          </div>
        )}

        {caseLibrary && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("sections.caseLibrary")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ArticleCard article={caseLibrary} />
              {CLUSTERS.map((cluster) => {
                const sample = getArticlesByCluster(locale, cluster).find(
                  (entry) =>
                    entry.contentType === "case" && entry.slug !== "case-library",
                );
                if (!sample) return null;
                return <ArticleCard key={`${cluster}-${sample.href}`} article={sample} />;
              })}
            </div>
          </div>
        )}

        {faqEntries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("sections.faqs")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {faqEntries.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          </div>
        )}

        {frameworkEntries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("sections.frameworks")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {frameworkEntries.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          </div>
        )}

        {conceptEntries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">{t("sections.concepts")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {conceptEntries.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          </div>
        )}

        {grouped.map(({ category, articles }) => (
          <div key={category}>
            <h2 className="text-xl font-bold mb-6">
              {t(`categories.${category}`)}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
