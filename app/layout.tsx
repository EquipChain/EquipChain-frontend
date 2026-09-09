import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/src/components/common/OfflineBanner";
import { AppShell } from "@/src/components/layout/AppShell";
import {
  ThemeProvider,
  THEME_COOKIE,
  type Theme,
} from "@/src/components/theme/ThemeProvider";
import { ToastProvider } from "@/src/components/ui/toast";

// Read the persisted theme choice server-side so the correct theme class is
// on <html> in the very first paint — no flash of the wrong theme.
async function getInitialTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viewport is a separate export in the App Router: folding these values into
// `metadata` is silently ignored, and without them mobile browsers fall back to
// a 980px layout viewport (pinch-zoom required) and the PWA/browser chrome
// picks no theme color. The dark value pairs with the `.dark` class that
// ThemeProvider toggles on <html>.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = await getInitialTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider initialTheme={initialTheme}>
          <ToastProvider>
            <OfflineBanner />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
