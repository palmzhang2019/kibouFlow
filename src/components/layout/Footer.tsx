import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-primary mb-2">GEO</p>
            <p className="text-sm text-muted">{t("footer.tagline")}</p>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <Link href="/guides" className="block text-sm text-muted hover:text-foreground transition-colors">
              {t("nav.guides")}
            </Link>
            <Link href="/faq" className="block text-sm text-muted hover:text-foreground transition-colors">
              {t("nav.faq")}
            </Link>
            <Link href="/partner" className="block text-sm text-muted hover:text-foreground transition-colors">
              {t("nav.partner")}
            </Link>
            <span className="block text-sm text-muted">
              {t("footer.privacy")}
            </span>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t("footer.xLink")}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-muted">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
