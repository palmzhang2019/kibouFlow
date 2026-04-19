import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getArticleSummary,
  getClusterLabel,
  type Article,
  type ArticleMeta,
  type Category,
  type FaqArticleSuggestion,
} from "@/lib/content";
import type { FaqPair } from "@/lib/faq-extractor";
import { slugifyHeading } from "@/lib/article-anchors";
import { Breadcrumb } from "./Breadcrumb";
import { AudienceBlock } from "./AudienceBlock";
import { ArticleCTA } from "./ArticleCTA";
import { ArticleConclusion } from "./ArticleConclusion";
import { RelatedArticles } from "./RelatedArticles";
import { TableOfContents } from "./TableOfContents";

const categoryColors: Record<Category, string> = {
  problems: "bg-amber-100 text-amber-800",
  paths: "bg-blue-100 text-blue-800",
  boundaries: "bg-emerald-100 text-emerald-800",
  cases: "bg-purple-100 text-purple-800",
};

interface InfoCard {
  id: string;
  title: string;
  description?: string;
  items?: string[];
}

interface ArticleLayoutProps {
  article: Article;
  relatedArticles: ArticleMeta[];
  clusterEntry?: ArticleMeta | null;
  faqPairs?: FaqPair[];
  faqSuggestions?: FaqArticleSuggestion[];
  children: React.ReactNode;
}

function buildInfoCards(
  article: Article,
  t: ReturnType<typeof useTranslations>,
): InfoCard[] {
  const summary = getArticleSummary(article);
  const themeItems = Array.from(
    new Set([...(article.about ?? []), ...(article.mentions ?? [])]),
  ).slice(0, 4);

  switch (article.contentType) {
    case "cluster":
      return [
        {
          id: "template-theme-focus",
          title: t("template.cluster.themeFocus"),
          description: article.description,
          items: themeItems.length > 0 ? themeItems : article.tldr,
        },
      ];
    case "framework":
      return [
        {
          id: "template-use-when",
          title: t("template.framework.useWhen"),
          items: article.prerequisites,
        },
        {
          id: "template-judgment-outcome",
          title: t("template.framework.outcome"),
          items: article.expectedOutcome,
        },
        {
          id: "template-common-mistakes",
          title: t("template.framework.mistakes"),
          items: article.commonMistakes,
        },
      ];
    case "concept":
      return [
        {
          id: "template-definition",
          title: t("template.concept.definition"),
          description: summary,
          items: themeItems,
        },
        {
          id: "template-use-when",
          title: t("template.concept.useWhen"),
          items: article.suitableFor,
        },
        {
          id: "template-not-for",
          title: t("template.concept.notFor"),
          items: article.notSuitableFor,
        },
      ];
    case "faq":
      return [
        {
          id: "template-main-question",
          title: t("template.faq.mainQuestion"),
          description: summary,
          items: themeItems,
        },
      ];
    case "case":
      return [
        {
          id: "template-background",
          title: t("template.case.background"),
          description: article.description,
          items: article.prerequisites,
        },
        {
          id: "template-reusable-conclusion",
          title: t("template.case.reusableConclusion"),
          items: article.keyTakeaways ?? article.expectedOutcome,
        },
      ];
    default:
      return [];
  }
}

export function ArticleLayout({
  article,
  relatedArticles,
  clusterEntry,
  faqPairs = [],
  faqSuggestions = [],
  children,
}: ArticleLayoutProps) {
  const t = useTranslations("guides");
  const contentTypeLabel = article.contentType
    ? t(`contentTypes.${article.contentType}`)
    : null;
  const clusterLabel = article.cluster
    ? getClusterLabel(article.locale, article.cluster)
    : null;
  const clusterHub =
    clusterEntry && clusterEntry.slug !== article.slug ? clusterEntry : null;
  const infoCards = buildInfoCards(article, t).filter(
    (card) => card.description || (card.items && card.items.length > 0),
  );
  const faqNavItems =
    article.contentType === "faq"
      ? faqPairs.map((pair) => ({
          name: pair.name,
          id: slugifyHeading(pair.name),
        }))
      : [];
  const conclusionPoints =
    article.keyTakeaways?.length
      ? article.keyTakeaways
      : article.expectedOutcome?.length
        ? article.expectedOutcome
        : article.tldr?.slice(0, 2);
  const nextStepLinks = [
    {
      href: "/guides/cases/case-library",
      label: t("nextSteps.caseLibrary"),
    },
    {
      href:
        article.cluster === "japanese-path"
          ? "/guides/boundaries/faq-japanese-path"
          : article.cluster === "partner-needs"
            ? "/guides/boundaries/faq-partner-collaboration"
            : "/guides/boundaries/faq-job-prep",
      label: t("nextSteps.clusterFaq"),
    },
  ];

  return (
    <article className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Breadcrumb category={article.category} title={article.title} />

        <div className="mt-6">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${categoryColors[article.category]}`}
          >
            {contentTypeLabel || t(`categories.${article.category}`)}
          </span>
          {clusterLabel ? (
            <span className="ml-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {clusterLabel}
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
          {article.title}
        </h1>

        <p className="mt-3 text-sm text-muted">
          {t("publishedAt")} {article.publishedAt}
          {article.updatedAt &&
            article.updatedAt !== article.publishedAt &&
            ` · ${t("updatedAt")} ${article.updatedAt}`}
        </p>

        {article.tldr && article.tldr.length > 0 ? (
          <section
            id="template-tldr"
            aria-labelledby="article-tldr"
            className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <h2
              id="article-tldr"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/70"
            >
              TL;DR
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/85">
              {article.tldr.map((item) => (
                <li key={item} className="ml-4 list-disc pl-1">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {clusterHub ? (
          <section
            id="template-cluster-hub"
            aria-labelledby="template-cluster-hub-heading"
            className="mt-6 rounded-2xl border border-primary/15 bg-primary-light/20 p-5"
          >
            <h2 id="template-cluster-hub-heading" className="text-base font-bold">
              {t("template.clusterHub.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/85">
              {t("template.clusterHub.subtitle")}
            </p>
            <Link
              href={clusterHub.href}
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {clusterHub.title}
            </Link>
          </section>
        ) : null}

        {infoCards.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {infoCards.map((card) => (
              <section
                key={card.id}
                id={card.id}
                aria-labelledby={`${card.id}-heading`}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <h2 id={`${card.id}-heading`} className="text-base font-bold">
                  {card.title}
                </h2>
                {card.description ? (
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {card.description}
                  </p>
                ) : null}
                {card.items && card.items.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/85">
                    {card.items.map((item) => (
                      <li key={item} className="ml-4 list-disc pl-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        ) : null}

        {article.contentType === "cluster" && relatedArticles.length > 0 ? (
          <section
            id="template-reading-order"
            aria-labelledby="template-reading-order-heading"
            className="mt-6 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h2 id="template-reading-order-heading" className="text-base font-bold">
              {t("template.cluster.readingOrder")}
            </h2>
            <ol className="mt-3 space-y-3">
              {relatedArticles.slice(0, 5).map((related, index) => (
                <li key={related.href} className="flex gap-3 text-sm leading-6">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">
                    {index + 1}
                  </span>
                  <div>
                    <Link
                      href={related.href}
                      className="font-medium text-primary hover:underline"
                    >
                      {related.title}
                    </Link>
                    <p className="text-foreground/75">{getArticleSummary(related)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {article.contentType === "faq" && faqNavItems.length >= 3 ? (
          <section
            id="template-question-nav"
            aria-labelledby="template-question-nav-heading"
            className="mt-6 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h2 id="template-question-nav-heading" className="text-base font-bold">
              {t("template.faq.questionNav")}
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-6">
              {faqNavItems.map((item) => (
                <li key={item.id} className="ml-4 list-decimal pl-1">
                  <a href={`#${item.id}`} className="text-primary hover:underline">
                    {item.name}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {article.contentType === "faq" && faqSuggestions.length > 0 ? (
          <section
            id="template-faq-article-prep"
            aria-labelledby="template-faq-article-prep-heading"
            className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
          >
            <h2
              id="template-faq-article-prep-heading"
              className="text-base font-bold"
            >
              {t("template.faq.futureArticlePrep")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">
              {t("template.faq.futureArticlePrepHint")}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/85">
              {faqSuggestions.slice(0, 3).map((item) => (
                <li key={item.suggestedSlug} className="ml-4 list-disc pl-1">
                  {item.question}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AudienceBlock
          suitableFor={article.suitableFor}
          notSuitableFor={article.notSuitableFor}
        />

        <div className="mt-10 flex gap-10">
          <div className="min-w-0 flex-1">
            <div
              data-article-content
              className="prose prose-gray max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-a:text-primary"
            >
              {children}
            </div>

            <ArticleConclusion
              summary={getArticleSummary(article)}
              points={conclusionPoints}
            />

            <ArticleCTA
              ctaType={article.ctaType}
              articleSlug={`${article.category}/${article.slug}`}
            />

            <RelatedArticles articles={relatedArticles} />

            <section className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-sm font-semibold">{t("nextSteps.title")}</h2>
              <p className="mt-2 text-sm text-muted">{t("nextSteps.subtitle")}</p>
              <div className="mt-3 flex flex-col gap-2">
                {nextStepLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>

            <div className="mt-8">
              <Link
                href="/guides"
                className="text-sm text-muted transition-colors hover:text-primary"
              >
                {t("backToGuides")}
              </Link>
            </div>
          </div>

          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </article>
  );
}
