import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"
import { BillingPageClient } from "./page.client"

export const metadata = generateMetadata({
  title: "Billing",
  description: "View billing history, manage payments, and track usage costs for your utility meters on EquipChain.",
  path: "/billing",
})

export default function BillingPage() {
  const jsonLd = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Billing", path: "/billing" },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BillingPageClient />
    </>
  )
}
