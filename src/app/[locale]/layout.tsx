import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <WebSiteJsonLd locale={locale} />
        <NextIntlClientProvider messages={messages}>
          <TrackingProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TrackingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
