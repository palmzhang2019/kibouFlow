import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl, organizationId } from "@/lib/seo/site-url";

export function OrganizationJsonLd() {
  const site = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(site),
    name: "GEO",
    url: site,
    description: "帮助在日本发展但方向不清的人做希望整理和路径判断",
    sameAs: ["https://x.com"],
  };

  return <JsonLd data={jsonLd} id="jsonld-organization" />;
}
