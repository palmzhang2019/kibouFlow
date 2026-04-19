import { stripUndefinedDeep } from "@/lib/seo/strip-undefined";

export type JsonLdData = Record<string, unknown> | unknown[];

export function JsonLd({ data, id }: { data: JsonLdData; id?: string }) {
  const cleaned = stripUndefinedDeep(data);
  const json = JSON.stringify(cleaned).replace(/</g, "\\u003c");
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
