import Link from "next/link";
import { ArrowRight, BookOpen, FileCode2 } from "lucide-react";
import { generateMetadata } from "@/src/lib/seo/metadata";
import {
  breadcrumbListSchema,
  webApplicationSchema,
  organizationSchema,
} from "@/src/lib/seo/json-ld";
import { NAV_ITEMS } from "@/src/lib/navigation";

export const metadata = generateMetadata({
  title: "Home",
  description:
    "Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.",
  path: "/",
})

export default function Home() {
  // Merge the schemas into a single @graph instead of spreading three objects
  // into one flat blob: each schema function returns its own "@context" and
  // "@type" key, so a spread silently overwrites them all and search engines
  // see one mangled node instead of a valid graph.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      webApplicationSchema(),
      organizationSchema(),
      breadcrumbListSchema([{ name: "Home", path: "/" }]),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
        <main className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
          <div className="flex flex-col items-center gap-5">
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
              Built on Stellar Soroban
            </span>
            <h1 className="max-w-2xl text-4xl font-bold leading-12 tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
              Equipchain Dashboard
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Utility metering and billing for monitoring meters, managing gas
              buffers, and tracking usage — transparent, on-chain, and
              real-time.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link
              href="/dashboard"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-white transition-colors hover:bg-brand-700 sm:w-auto"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] sm:w-auto"
              href="https://github.com/EquipChain/EquipChain-contracts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileCode2 className="h-4 w-4" aria-hidden="true" />
              View contracts
            </a>
            <a
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] sm:w-auto"
              href="https://github.com/EquipChain/EquipChain-backend"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Backend API
            </a>
          </div>

          {/* Section cards mirroring the app navigation */}
          <nav aria-label="Explore sections" className="mt-6 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-brand-300 dark:bg-zinc-950"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-400">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <p className="font-semibold text-black group-hover:text-brand-700 dark:text-zinc-50 dark:group-hover:text-brand-300">
                  {label}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              </Link>
            ))}
          </nav>
        </main>
      </div>
    </>
  );
}
