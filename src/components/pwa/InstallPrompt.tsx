"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/src/lib/hooks/usePwaInstall";
import { Button } from "@/src/components/ui/Button";

// ============================================================================
// InstallPrompt — surfaces the browser's PWA install affordance
// ============================================================================
// The usePwaInstall hook existed but nothing rendered it: the app was
// installable (after the icon fixes) yet users had no in-app path to
// discover installation. This banner appears once the beforeinstallprompt
// event fires and can be dismissed for the session.

const DISMISS_KEY = "equipchain-install-dismissed";

// sessionStorage is an external store; subscribing through
// useSyncExternalStore keeps the dismissal read hydration-safe without a
// setState-in-effect (which re-renders and trips the react-hooks lint rule).
const DISMISS_EVENT = "equipchain:install-dismissed";

function subscribeToDismissal(onChange: () => void): () => void {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

function getDismissedSnapshot(): boolean {
  return sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function InstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [installState, setInstallState] = useState<"idle" | "accepted" | "dismissed">("idle");
  const dismissed = useSyncExternalStore(subscribeToDismissal, getDismissedSnapshot, () => true);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }, []);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    setInstallState(outcome === "accepted" ? "accepted" : "dismissed");
    if (outcome === "accepted") handleDismiss();
  };

  if (installState === "accepted") return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
        <Download className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">Install EquipChain</p>
        <p className="text-xs text-text-muted">
          {installState === "dismissed"
            ? "You can install later from your browser menu."
            : "Add the dashboard to your home screen for offline access."}
        </p>
      </div>
      <Button size="sm" onClick={() => void handleInstall()}>
        Install
      </Button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="rounded p-1 text-text-muted hover:text-text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
