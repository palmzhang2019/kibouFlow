import { JsonLd } from "@/components/seo/JsonLd";
import type { HowToExtract } from "@/lib/howto-extractor";
import { localeToInLanguage } from "@/lib/seo/site-url";

export function HowToJsonLd({
  howTo,
  locale,
}: {
  howTo: HowToExtract;
  locale: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    inLanguage: localeToInLanguage(locale),
    ...(howTo.name ? { name: howTo.name } : {}),
    step: howTo.steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      text: s.text,
    })),
  };
  return <JsonLd data={data} id="jsonld-howto" />;
}
