interface ThreeSectionBlockProps {
  /** Input conditions (starting state) */
  inputLabel?: string;
  inputItems: string[];
  /** Decision basis (key evidence/signals) */
  decisionLabel?: string;
  decisionItems: string[];
  /** Result (recommendation and next steps) */
  resultLabel?: string;
  resultItems: string[];
}

export function ThreeSectionBlock({
  inputLabel = "输入条件",
  inputItems,
  decisionLabel = "判断依据",
  decisionItems,
  resultLabel = "结果",
  resultItems,
}: ThreeSectionBlockProps) {
  return (
    <section
      className="my-6 rounded-2xl border border-gray-200 bg-white overflow-hidden"
      aria-label="三段式判定结构"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="p-4 bg-gray-50">
          <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-1.5">
            <span className="text-primary text-base">→</span>
            {inputLabel}
          </h3>
          <ul className="space-y-1.5">
            {inputItems.map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-white">
          <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-1.5">
            <span className="text-amber-500 text-base">◆</span>
            {decisionLabel}
          </h3>
          <ul className="space-y-1.5">
            {decisionItems.map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-emerald-50/50">
          <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-1.5">
            <span className="text-emerald-600 text-base">✓</span>
            {resultLabel}
          </h3>
          <ul className="space-y-1.5">
            {resultItems.map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
