import { generateMetadata } from "@/src/lib/seo/metadata"
import { breadcrumbListSchema } from "@/src/lib/seo/json-ld"

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <main className="flex flex-col items-center gap-8 py-32 px-16">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Streams
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Streams content coming soon.
          </p>
        </main>
      </div>
    </>
  )
}
