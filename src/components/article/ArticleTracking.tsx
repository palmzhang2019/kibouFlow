"use client";

import { useEffect, useRef } from "react";
import { useTracking } from "@/components/tracking/TrackingProvider";

interface ArticleTrackingProps {
  category: string;
  slug: string;
}

export function ArticleTracking({ category, slug }: ArticleTrackingProps) {
  const { trackCTAClick } = useTracking();
  const trackedDepths = useRef(new Set<number>());

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const t of thresholds) {
        if (pct >= t && !trackedDepths.current.has(t)) {
          trackedDepths.current.add(t);
          trackCTAClick(
            `article-scroll-${t}-${category}/${slug}`,
            `scroll_depth_${t}`,
          );
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [category, slug, trackCTAClick]);

  return null;
}
