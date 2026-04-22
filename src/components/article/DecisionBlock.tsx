interface DecisionCondition {
  label: string;
  description?: string;
}

interface DecisionBranch {
  condition: string;
  conclusion: string;
  action: string;
}

interface DecisionBlockProps {
  /** Section heading, defaults to "量化判定" */
  heading?: string;
  /** Label shown above conditions list */
  conditionsLabel?: string;
  /** Label shown above judgment branches */
  branchesLabel?: string;
  /** Label for action in each branch */
  actionLabel?: string;
  /** Note shown at bottom when no branch matches */
  fallbackNote?: string;
  /** Conditions for the judgment */
  conditions: DecisionCondition[];
  /** Decision branches with condition, conclusion, and suggested action */
  branches: DecisionBranch[];
  /** Fallback action when no branch matches */
  defaultAction?: string;
}

export function DecisionBlock({
  heading = "量化判定",
  conditionsLabel = "判定条件",
  branchesLabel = "判断分支",
  actionLabel = "建议动作",
  fallbackNote = "若不符合以上条件",
  conditions,
  branches,
  defaultAction,
}: DecisionBlockProps) {
  return (
    <section
      className="my-6 rounded-2xl border-2 border-primary/20 bg-primary-light/10 p-5"
      aria-labelledby="decision-block-heading"
    >
      <h3
        id="decision-block-heading"
        className="text-base font-bold text-foreground"
      >
        {heading}
      </h3>

      {conditions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground/80 mb-2">
            {conditionsLabel}
          </p>
          <ul className="space-y-1.5">
            {conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary font-semibold shrink-0">
                  [{i + 1}]
                </span>
                <span className="text-foreground/85">
                  {c.label}
                  {c.description && (
                    <span className="text-muted ml-1">— {c.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <p className="text-sm font-semibold text-foreground/80 mb-3">
          {branchesLabel}
        </p>
        <div className="space-y-3">
          {branches.map((branch, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  {branch.condition}
                </span>
                <span className="text-sm text-foreground/90 leading-relaxed">
                  {branch.conclusion}
                </span>
              </div>
              {branch.action && (
                <p className="mt-1.5 text-xs text-muted pl-2 border-l-2 border-gray-200">
                  {actionLabel}: {branch.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {defaultAction && (
        <div className="mt-4 pt-3 border-t border-primary/20">
          <p className="text-xs text-muted">
            {fallbackNote}: {defaultAction}
          </p>
        </div>
      )}
    </section>
  );
}
