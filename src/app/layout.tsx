import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl, getDefaultOgImage } from "@/lib/seo/site-url";

const SITE_URL = getSiteUrl();
const SITE_DESCRIPTION = "先整理希望，再判断路径，再导向下一步";
const DEFAULT_OG_IMAGE = getDefaultOgImage();

export const metadata: Metadata = {
  title: "kibouFlow",
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "kibouFlow",
    title: "kibouFlow",
    description: SITE_DESCRIPTION,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 1200,
        alt: "kibouFlow",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "kibouFlow",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
