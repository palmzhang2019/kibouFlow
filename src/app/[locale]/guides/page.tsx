import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { ArticleCard } from "@/components/article/ArticleCard";
import { getAllArticles, CATEGORIES } from "@/lib/content";
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

  const grouped = CATEGORIES.map((cat) => ({
    category: cat as Category,
    articles: allArticles.filter((a) => a.category === cat),
  })).filter((g) => g.articles.length > 0);

  return (
    <Section>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-14 space-y-14">
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
