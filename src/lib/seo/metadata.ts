import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

const titleTemplate = "%s | EquipChain"

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "EquipChain Dashboard",
    template: titleTemplate,
  },
  description:
    "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
  openGraph: {
    type: "website",
    siteName: "EquipChain",
    title: "EquipChain Dashboard",
    description:
      "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
    url: baseUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@equipchain",
    creator: "@equipchain",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export function generateMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string
  description?: string
  path?: string
  image?: string
}): Metadata {
  const url = path ? `${baseUrl}${path}` : baseUrl
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: title }]
    : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images,
    },
    twitter: {
      title,
      description,
      images: images ? images.map((i) => i.url) : undefined,
    },
  }
}
