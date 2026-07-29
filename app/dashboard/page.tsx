import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"
import { DashboardPageClient } from "./page.client"

export const metadata = generateMetadata({
  title: "Dashboard",
  description: "Overview of your utility meters, usage statistics, and recent activity on EquipChain.",
  path: "/dashboard",
})

export default function DashboardPage() {
  const jsonLd = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardPageClient />
    </>
  )
}
