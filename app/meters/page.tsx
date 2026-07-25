import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <main className="flex flex-col items-center gap-8 py-32 px-16">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Meters
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Meters content coming soon.
          </p>
        </main>
      </div>
    </>
  )
}
