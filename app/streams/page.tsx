import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"
import { StreamsPageClient } from "./page.client"

export const metadata = generateMetadata({
  title: "Streams",
  description: "Monitor real-time data streams from your utility meters and view live usage feeds on EquipChain.",
  path: "/streams",
})

export default function StreamsPage() {
  const jsonLd = breadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "Streams", path: "/streams" },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StreamsPageClient />
    </>
  )
}
