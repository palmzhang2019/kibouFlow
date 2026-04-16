import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO",
  description: "先整理希望，再判断路径，再导向下一步",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
