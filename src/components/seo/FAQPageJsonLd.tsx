import { JsonLd } from "@/components/seo/JsonLd";
import type { FaqPair } from "@/lib/faq-extractor";
import { localeToInLanguage } from "@/lib/seo/site-url";

export function FAQPageJsonLd({ pairs, locale }: { pairs: FaqPair[]; locale: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: localeToInLanguage(locale),
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.name,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.text,
      },
    })),
  };
  return <JsonLd data={data} id="jsonld-faqpage-mdx" />;
}
