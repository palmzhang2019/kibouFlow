"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripGeoAuditJsonAppendix } from "@/lib/geo-audit-report-markdown";

export function GeoAuditMarkdown({ markdown }: { markdown: string }) {
  const body = stripGeoAuditJsonAppendix(markdown);
  return (
    <article className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:text-xs prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </article>
  );
}
