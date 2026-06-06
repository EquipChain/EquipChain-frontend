export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xl text-4xl font-bold leading-12 tracking-tight text-black dark:text-zinc-50">
            Equipchain Dashboard
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Utility metering and billing dashboard for monitoring meters, managing gas buffers, and tracking usage on Stellar Soroban.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://github.com/EquipChain/EquipChain-contracts"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Contracts
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://github.com/EquipChain/EquipChain-backend"
            target="_blank"
            rel="noopener noreferrer"
          >
            Backend API
          </a>
        </div>
      </main>
    </div>
  );
}
