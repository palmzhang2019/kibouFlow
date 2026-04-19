import type { MDXComponents } from "mdx/types";
import { resolveHeadingId } from "@/lib/article-anchors";

function Callout({
  children,
  type = "info",
}: {
  children: React.ReactNode;
  type?: "info" | "warning" | "tip";
}) {
  const styles = {
    info: "border-primary/30 bg-primary-light/30 text-foreground",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    tip: "border-emerald-300 bg-emerald-50 text-emerald-900",
  };

  const icons = {
    info: "💡",
    warning: "⚠️",
    tip: "✅",
  };

  return (
    <div
      className={`my-6 rounded-lg border-l-4 p-4 text-sm ${styles[type]}`}
    >
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  );
}

function StepList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-6 space-y-4 list-none pl-0 counter-reset-step">
      {children}
    </ol>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
        {number}
      </span>
      <div className="flex-1 pt-0.5">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
    </li>
  );
}

export function getMDXComponents(): MDXComponents {
  return {
    Callout,
    StepList,
    Step,
    h2: ({ children, id, ...props }) => (
      <h2
        {...props}
        id={resolveHeadingId(children, id)}
        className="scroll-mt-20 text-xl font-bold mt-10 mb-4 text-foreground"
      >
        {children}
      </h2>
    ),
    h3: ({ children, id, ...props }) => (
      <h3
        {...props}
        id={resolveHeadingId(children, id)}
        className="scroll-mt-20 text-lg font-semibold mt-8 mb-3 text-foreground"
      >
        {children}
      </h3>
    ),
    a: (props) => (
      <a
        {...props}
        className="text-primary underline underline-offset-2 hover:text-primary-dark transition-colors"
      />
    ),
  };
}
