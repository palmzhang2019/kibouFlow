import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl, localeToInLanguage, organizationId } from "@/lib/seo/site-url";

export function WebSiteJsonLd({ locale }: { locale: string }) {
  const site = getSiteUrl();
  const websiteId = `${site}/${locale}/#website`;
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: "GEO",
    url: `${site}/${locale}`,
    inLanguage: localeToInLanguage(locale),
    publisher: { "@id": organizationId(site) },
  };
  return <JsonLd data={data} id={`jsonld-website-${locale}`} />;
}
