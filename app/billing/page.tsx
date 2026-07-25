import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <main className="flex flex-col items-center gap-8 py-32 px-16">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Billing
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Billing content coming soon.
          </p>
        </main>
      </div>
    </>
  )
}
