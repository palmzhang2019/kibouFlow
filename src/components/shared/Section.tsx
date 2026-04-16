interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bg?: "white" | "muted";
}

export function Section({ children, className = "", id, bg = "white" }: SectionProps) {
  const bgClass = bg === "muted" ? "bg-muted-light" : "bg-white";

  return (
    <section id={id} className={`py-16 sm:py-20 ${bgClass} ${className}`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
