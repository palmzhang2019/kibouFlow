import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: configDir,
  },
  async redirects() {
    return [
      // Redirect non-locale user-facing URLs to zh-prefixed equivalents.
      // These are URLs that Google Search Console discovered returning 404.
      // Uses 308 (permanent) to preserve HTTP method.
      {
        source: "/guides",
        destination: "/zh/guides",
        permanent: true,
      },
      {
        source: "/guides/:path+",
        destination: "/zh/guides/:path+",
        permanent: true,
      },
      {
        source: "/partner",
        destination: "/zh/partner",
        permanent: true,
      },
      {
        source: "/partner/:path+",
        destination: "/zh/partner/:path+",
        permanent: true,
      },
      {
        source: "/trial",
        destination: "/zh/trial",
        permanent: true,
      },
      {
        source: "/trial/:path+",
        destination: "/zh/trial/:path+",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/zh/faq",
        permanent: true,
      },
      {
        source: "/faq/:path+",
        destination: "/zh/faq/:path+",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
