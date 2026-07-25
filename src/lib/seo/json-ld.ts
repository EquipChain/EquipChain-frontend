const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "EquipChain Dashboard",
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
    browserRequirements: "Requires modern browser with JavaScript enabled",
  }
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EquipChain",
    url: baseUrl,
    description:
      "Decentralized utility metering and billing platform on Stellar Soroban",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "support",
      url: `${baseUrl}/contact`,
    },
    sameAs: [
      "https://github.com/EquipChain",
      "https://github.com/EquipChain/EquipChain-contracts",
      "https://github.com/EquipChain/EquipChain-backend",
    ],
  }
}

export function breadcrumbListSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  }
}
