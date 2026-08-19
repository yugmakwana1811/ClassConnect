import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ClassConnect", template: "%s · ClassConnect" },
  description: "Connecting the classroom beyond the classroom.",
  applicationName: "ClassConnect",
  openGraph: {
    type: "website",
    siteName: "ClassConnect",
    title: "ClassConnect",
    description: "Connecting the classroom beyond the classroom.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
