"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";
import { Modal } from "@/src/components/ui/Modal";
import { Kbd } from "@/src/components/ui/Kbd";

// ============================================================================
// KeyboardShortcutsDialog — discoverable keyboard layer (press ?)
// ============================================================================
// The app gained real keyboard affordances (Ctrl/Cmd+K palette, Escape to
// close overlays) but nothing advertised them: users had to read source or
// stumble into them. A ? shortcut rendering a reference dialog is the
// convention for this; it also documents the affordances for screen-reader
// and switch users. The component also implements the g+key navigation
// sequences it advertises, so the reference can never drift from the
// behavior.

interface ShortcutRow {
  keys: string[];
  description: string;
}

const SECTIONS: { title: string; shortcuts: ShortcutRow[] }[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open the command palette (⌘K on Mac)" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "M"], description: "Go to Meters" },
      { keys: ["G", "B"], description: "Go to Billing" },
      { keys: ["G", "S"], description: "Go to Streams" },
    ],
  },
  {
    title: "Overlays",
    shortcuts: [
      { keys: ["Esc"], description: "Close the active dialog or palette" },
      { keys: ["?"], description: "Show this shortcut reference" },
    ],
  },
];

/** Section targets for the g+key sequences advertised above. */
export const GO_TO_KEYS: Record<string, string> = {
  d: "/dashboard",
  m: "/meters",
  b: "/billing",
  s: "/streams",
};

const G_SEQUENCE_WINDOW_MS = 1000;

function isTypingContext(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Track focus context on a ref so the key handler never re-subscribes.
  const inInputRef = useRef(false);

  // Two-key "g then d/m/b/s" sequences: the leading g arms a short window;
  // the next key navigates. The timer self-cancels so a stray g never
  // lingers to hijack a later keypress.
  const gArmedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "?" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !inInputRef.current
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (inInputRef.current) return;

      // Vim-style g-prefixed navigation.
      if (event.key === "g" && !gArmedRef.current) {
        gArmedRef.current = true;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        gTimerRef.current = setTimeout(() => {
          gArmedRef.current = false;
        }, G_SEQUENCE_WINDOW_MS);
        return;
      }
      if (gArmedRef.current) {
        const target = GO_TO_KEYS[event.key.toLowerCase()];
        gArmedRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        if (target) {
          event.preventDefault();
          router.push(target);
        }
      }
    };

    // focusin/focusout on capture keeps the typing-context flag accurate
    // even when focus moves outside React's synthetic event delegation.
    const trackFocusIn = (event: FocusEvent) => {
      inInputRef.current = isTypingContext(event.target);
    };
    const trackFocusOut = () => {
      inInputRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("focusin", trackFocusIn, true);
    window.addEventListener("focusout", trackFocusOut, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focusin", trackFocusIn, true);
      window.removeEventListener("focusout", trackFocusOut, true);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [open, router]);

  return (
    <>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Keyboard shortcuts"
        description="Move around EquipChain without leaving the keyboard."
        size="md"
      >
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title} aria-label={section.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
              </h3>
              <ul className="divide-y divide-border-light">
                {section.shortcuts.map(({ keys, description }) => (
                  <li
                    key={description}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <span className="text-sm text-text-secondary">{description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {keys.map((key, index) => (
                        <span key={key} className="flex items-center gap-1">
                          {index > 0 && (
                            <span className="text-xs text-text-muted" aria-hidden="true">
                              then
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Modal>

      {/* Help affordance for mouse users and discoverability of the ? key */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        className="fixed bottom-4 left-4 z-40 hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted shadow-sm transition-colors hover:text-text-primary md:inline-flex"
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        Shortcuts
        <Kbd>?</Kbd>
      </button>
    </>
  );
}
