import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/Section";
import { ArticleCard } from "@/components/article/ArticleCard";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildBreadcrumbItems } from "@/lib/seo/breadcrumbs";
import {
  getArticlesByCategory,
  CATEGORIES,
  type Category,
} from "@/lib/content";
import { resolveGeoMetadata } from "@/lib/geo-settings";
import { getGeoSchemaToggles } from "@/lib/geo-rules";
import { type SupportedLocale, LOCALE_TO_BCP47, SUPPORTED_LOCALES } from "@/i18n/routing";

interface PageParams {
  locale: string;
  category: string;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    CATEGORIES.map((category) => ({ locale, category })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, category } = await params;

  if (!CATEGORIES.includes(category as Category)) return {};

  const t = await getTranslations({ locale, namespace: "guides" });
  const categoryLabel = t(`categories.${category as Category}`);
  const categoryDesc = t(`categoryDescriptions.${category as Category}`);
  const title = t("categoryPageTitle", { category: categoryLabel });
  const url = `/${locale}/guides/${category}`;

  const resolved = await resolveGeoMetadata({
    locale: locale as SupportedLocale,
    path: url,
    existingTitle: title,
    existingDescription: categoryDesc,
    existingCanonical: url,
    existingOpenGraph: {
      title: categoryLabel,
      description: categoryDesc,
      locale: LOCALE_TO_BCP47[locale as SupportedLocale],
    },
  });

  return {
    title: resolved.title,
    description: resolved.description,
    openGraph: resolved.openGraph,
    twitter: resolved.twitter,
    alternates: {
      canonical: resolved.canonical,
      languages: {
        "x-default": `/zh/guides/${category}`,
        zh: `/zh/guides/${category}`,
        ja: `/ja/guides/${category}`,
        en: `/en/guides/${category}`,
      },
    },
    robots: resolved.robots,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, category } = await params;

  if (!CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const articles = getArticlesByCategory(locale, category);
  const t = await getTranslations({ locale, namespace: "guides" });
  const tNav = await getTranslations({ locale, namespace: "common.nav" });
  const toggles = await getGeoSchemaToggles(
    locale as SupportedLocale,
    `/${locale}/guides/${category}`,
  );

  const categoryLabel = t(`categories.${category as Category}`);
  const categoryDesc = t(`categoryDescriptions.${category as Category}`);

  const crumbs = buildBreadcrumbItems([
    { path: `/${locale}`, name: tNav("home") },
    { path: `/${locale}/guides`, name: tNav("guides") },
    { path: `/${locale}/guides/${category}`, name: categoryLabel },
  ]);

  return (
    <>
      {toggles.data.enable_breadcrumb ? (
        <BreadcrumbJsonLd items={crumbs} id="jsonld-breadcrumb-category" />
      ) : null}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{categoryLabel}</h1>
          <p className="mt-3 text-muted">{categoryDesc}</p>
        </div>

        <div className="mt-14">
          {articles.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.href} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">
              {t("emptyCategory")}
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
