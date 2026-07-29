import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/src/components/common/OfflineBanner";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "EquipChain Dashboard",
    template: "%s | EquipChain",
  },
  description:
    "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
  manifest: "/manifest.json",
  openGraph: {
    title: "EquipChain Dashboard",
    description:
      "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
    url: baseUrl,
    siteName: "EquipChain",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "EquipChain Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@equipchain",
    creator: "@equipchain",
    title: "EquipChain Dashboard",
    description:
      "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
