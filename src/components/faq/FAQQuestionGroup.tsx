"use client";

import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQQuestionGroupProps {
  groupHeading: string;
  items: FAQItem[];
  groupIndex: number;
}

export function FAQQuestionGroup({ groupHeading, items, groupIndex }: FAQQuestionGroupProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section aria-labelledby={`faq-group-${groupIndex}-heading`}>
      <h2
        id={`faq-group-${groupIndex}-heading`}
        className="text-lg font-bold text-foreground pb-3 border-b border-gray-200"
      >
        {groupHeading}
      </h2>
      <div className="divide-y divide-gray-200 border-t border-b border-gray-200 mt-1">
        {items.map((item, i) => {
          const questionId = `faq-group-${groupIndex}-q-${i}`;
          const answerId = `faq-group-${groupIndex}-a-${i}`;
          return (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between py-5 text-left"
                aria-expanded={openIndex === i}
                aria-controls={answerId}
                id={questionId}
              >
                <span className="text-sm sm:text-base font-medium pr-4 text-foreground">
                  {item.q}
                </span>
                <svg
                  className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openIndex === i && (
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className="pb-5 pr-12"
                >
                  <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}