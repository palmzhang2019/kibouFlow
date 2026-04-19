import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl, organizationId } from "@/lib/seo/site-url";

const TRUSTED_SAME_AS_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "github.com",
  "linkedin.com",
  "www.linkedin.com",
]);

function isTrustedSameAsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      TRUSTED_SAME_AS_HOSTS.has(url.hostname) &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

export function buildOrganizationSameAs(): string[] {
  return [
    process.env.NEXT_PUBLIC_ORGANIZATION_X_URL,
    process.env.NEXT_PUBLIC_ORGANIZATION_GITHUB_URL,
    process.env.NEXT_PUBLIC_ORGANIZATION_LINKEDIN_URL,
  ].filter((value): value is string => typeof value === "string" && isTrustedSameAsUrl(value));
}

export function OrganizationJsonLd() {
  const site = getSiteUrl();
  const sameAs = buildOrganizationSameAs();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(site),
    name: "GEO",
    url: site,
    description: "Support for clarifying goals and choosing the next step for people building in Japan.",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return <JsonLd data={jsonLd} id="jsonld-organization" />;
}
