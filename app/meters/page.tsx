import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"
import { MetersPageClient } from "./page.client"

export const metadata = generateMetadata({
  title: "Meters",
  description: "View and manage your utility meters, monitor consumption, and configure meter parameters on EquipChain.",
  path: "/meters",
})

export default function MetersPage() {
  const jsonLd = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Meters", path: "/meters" },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MetersPageClient />
    </>
  )
}
