import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/content";

interface BreadcrumbProps {
  category: Category;
  title: string;
}

export function Breadcrumb({ category, title }: BreadcrumbProps) {
  const t = useTranslations("guides");
  const nav = useTranslations("common.nav");

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-foreground transition-colors">
            {nav("home")}
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">
          /
        </li>
        <li>
          <Link
            href="/guides"
            className="hover:text-foreground transition-colors"
          >
            {nav("guides")}
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">
          /
        </li>
        <li>
          <Link
            href="/guides"
            className="hover:text-foreground transition-colors"
          >
            {t(`categories.${category}`)}
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">
          /
        </li>
        <li className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {title}
        </li>
      </ol>
    </nav>
  );
}
