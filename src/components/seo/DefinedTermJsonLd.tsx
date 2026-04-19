import { JsonLd } from "@/components/seo/JsonLd";
import type { Article } from "@/lib/content";
import { absoluteUrl, getSiteUrl, localeToInLanguage } from "@/lib/seo/site-url";

function getDefinedTermSetName(locale: string) {
  return locale === "ja" ? "GEO Concept Guides" : "GEO Concept Guides";
}

export function DefinedTermJsonLd({
  article,
  locale,
}: {
  article: Article;
  locale: string;
}) {
  const site = getSiteUrl();
  const pageUrl = absoluteUrl(`/${locale}${article.href}`, site);
  const definedTermSetUrl = absoluteUrl(`/${locale}/guides`, site);
  const data = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: article.title,
    description: article.description,
    url: pageUrl,
    inLanguage: localeToInLanguage(locale),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${definedTermSetUrl}#concepts`,
      name: getDefinedTermSetName(locale),
      url: definedTermSetUrl,
    },
  };

  return <JsonLd data={data} id="jsonld-definedterm" />;
}
