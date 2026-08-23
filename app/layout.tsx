import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cipher.manabeakira.com"),
  title: "Cipher — Classified links",
  description: "Seal a destination into a client-side encrypted Cipher capsule with optional access code, expiry and local burn-after-reveal.",
  openGraph: {
    title: "Cipher — Classified links",
    description: "Links with clearance. Client-side encrypted capsules with no destination database.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050706",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
