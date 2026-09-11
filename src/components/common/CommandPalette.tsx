"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { NAV_ITEMS } from "@/src/lib/navigation";
import { Kbd } from "@/src/components/ui/Kbd";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// CommandPalette — Ctrl/Cmd+K quick navigation
// ============================================================================
// Power users (operators checking dozens of meters daily) navigate the
// same four sections hundreds of times; keyboard-first navigation is the
// standard accelerator. The palette is driven by NAV_ITEMS so new sections
// appear automatically, and matches on label + description.

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The global keydown listener below needs the latest toggle without
  // re-subscribing on every render; a ref holds the stable callback.
  const toggleRef = useRef<() => void>(() => {});

  const items: PaletteItem[] = useMemo(
    () =>
      NAV_ITEMS.map(({ href, label, description }) => ({
        id: href,
        label,
        description,
        href,
      })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Global keybind: Ctrl/Cmd+K toggles, Escape closes. The header button
  // dispatches the custom toggle event so both entry points share toggle().
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleRef.current();
      } else if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const handleCustomToggle = () => toggleRef.current();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("equipchain:toggle-palette", handleCustomToggle);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("equipchain:toggle-palette", handleCustomToggle);
    };
  }, [open]);

  // Focus the input when it opens. Resetting query/selection is handled in
  // toggle() (event-driven, not effect-driven) so opening always starts from
  // a clean state without a setState-in-effect cascade.
  useEffect(() => {
    if (open) {
      // rAF so the input exists after the state flip renders.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const toggle = () => {
    setOpen((o) => {
      if (!o) {
        // Reset transient state as part of opening — derived on the next
        // render, no effect needed.
        setQuery("");
        setActiveIndex(0);
      }
      return !o;
    });
  };

  // Ref writes belong in effects, not render body.
  useEffect(() => {
    toggleRef.current = toggle;
  });

  // Clamp the active index during render (a derived-value adjustment, the
  // React-recommended pattern) rather than in an effect.
  const clampedIndex = filtered.length
    ? Math.min(activeIndex, filtered.length - 1)
    : 0;

  const choose = (item: PaletteItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(clampedIndex + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(clampedIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[clampedIndex];
      if (item) choose(item);
    }
  };

  // Keep the active option in view while arrowing through.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.children[clampedIndex]?.scrollIntoView({ block: "nearest" });
  }, [clampedIndex]);

  return (
    <>
      {/* Trigger lives in the header; the palette itself is portal-free. */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={filtered.length > 0}
                aria-controls="command-palette-list"
                aria-activedescendant={
                  filtered[clampedIndex]
                    ? `command-palette-option-${clampedIndex}`
                    : undefined
                }
                aria-label="Search commands"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Jump to…"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <Kbd>Esc</Kbd>
            </div>

            <ul
              id="command-palette-list"
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="max-h-80 overflow-y-auto p-2"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-text-muted">
                  No matches for “{query}”
                </li>
              ) : (
                filtered.map((item, index) => (
                  <li
                    key={item.id}
                    id={`command-palette-option-${index}`}
                    role="option"
                    aria-selected={index === clampedIndex}
                    onClick={() => choose(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                      index === clampedIndex
                        ? "bg-brand-50 dark:bg-brand-900/30"
                        : ""
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {item.label}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {item.description}
                      </p>
                    </div>
                    {index === clampedIndex && (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 shrink-0 text-text-muted"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
