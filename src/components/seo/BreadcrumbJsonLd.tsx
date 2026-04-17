import { JsonLd } from "@/components/seo/JsonLd";
import type { BreadcrumbItem } from "@/lib/seo/breadcrumbs";

export function BreadcrumbJsonLd({ items, id }: { items: BreadcrumbItem[]; id?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
  return <JsonLd data={data} id={id ?? "jsonld-breadcrumb"} />;
}
