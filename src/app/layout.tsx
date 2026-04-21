import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/seo/site-url";

const SITE_URL = getSiteUrl();
const SITE_DESCRIPTION = "先整理希望，再判断路径，再导向下一步";

export const metadata: Metadata = {
  title: "GEO",
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "GEO",
    title: "GEO",
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
