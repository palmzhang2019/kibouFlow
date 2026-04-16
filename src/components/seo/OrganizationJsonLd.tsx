const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GEO",
    url: BASE_URL,
    description: "帮助在日本发展但方向不清的人做希望整理和路径判断",
    sameAs: ["https://x.com"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
