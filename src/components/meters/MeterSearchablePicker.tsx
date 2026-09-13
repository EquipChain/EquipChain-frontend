"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Gauge, Search } from "lucide-react";
import { Input } from "@/src/components/ui/Input";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// MeterSearchablePicker — accessible combobox for choosing a meter
// ============================================================================
// The reading form's meter field was a plain input with a datalist. Native
// datalists render inconsistently (Chrome shows it, Safari often does not),
// cannot be styled, match only on prefix, and — critically — accept any
// typed value, so a typo reached the queue and failed at sync time. This
// combobox filters across id AND name, validates selection from the loaded
// meter list, and follows the WAI-ARIA 1.2 combobox pattern so keyboard and
// screen-reader users get the same affordance.

export interface MeterOption {
  id: string;
  name: string;
  /** Optional context line, e.g. "Electric · Building A" */
  meta?: string;
}

export interface MeterSearchablePickerProps {
  /** Chosen meter id; empty string when nothing is selected */
  value: string;
  onChange: (meterId: string) => void;
  options: MeterOption[];
  /** Marks the field invalid and renders the error line */
  error?: string;
  /** Marks the field required with the asterisk convention */
  required?: boolean;
  onBlur?: () => void;
  placeholder?: string;
  id?: string;
  name?: string;
}

const MAX_VISIBLE_OPTIONS = 6;

export function MeterSearchablePicker({
  value,
  onChange,
  options,
  error,
  required = false,
  onBlur,
  placeholder = "Search meters…",
  id,
  name,
}: MeterSearchablePickerProps) {
  const reactId = useId();
  const listboxId = `meter-picker-list-${reactId}`;
  const inputId = id ?? `meter-picker-input-${reactId}`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.id.toLowerCase().includes(q) ||
        option.name.toLowerCase().includes(q)
    );
  }, [options, query]);

  const clampedIndex = filtered.length
    ? Math.min(activeIndex, filtered.length - 1)
    : 0;

  const openList = () => {
    setOpen(true);
    setActiveIndex(0);
  };

  const choose = (option: MeterOption) => {
    onChange(option.id);
    setQuery("");
    setOpen(false);
  };

  const handleSelect = (option: MeterOption) => {
    if (option) choose(option);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (open) setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (open && filtered[clampedIndex]) {
          event.preventDefault();
          choose(filtered[clampedIndex]);
        }
        break;
      case "Escape":
        if (open) {
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  // Keep the active option in view while arrowing through the list.
  const scrollActiveIntoView = () => {
    requestAnimationFrame(() => {
      const active = listRef.current?.children[clampedIndex];
      // Guarded: scrollIntoView is unavailable in some environments
      // (jsdom, certain embedded webviews) and optional-chaining does not
      // protect against a missing method on the element.
      if (active && typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "nearest" });
      }
    });
  };

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
        Meter
        {required && (
          <span className="text-error ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* ARIA 1.2: the combobox role sits on the input element itself, so
          focus, keydown, and the aria-* state all live on one node and the
          pattern works for pointer, keyboard, and assistive tech alike. */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          name={name}
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            open && filtered.length > 0
              ? `meter-option-${reactId}-${clampedIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-invalid={Boolean(error) || undefined}
          placeholder={placeholder}
          error={Boolean(error)}
          // Editing the field filters; the selected meter's name is the
          // display value when closed.
          value={open ? query : selected ? `${selected.id} — ${selected.name}` : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) openList();
          }}
          onFocus={() => openList()}
          onBlur={() => {
            setOpen(false);
            onBlur?.();
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
            scrollActiveIntoView();
          }}
          className="pl-9 pr-9"
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Meters"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li
              role="option"
              aria-selected={false}
              aria-disabled="true"
              className="px-3 py-2.5 text-sm text-text-muted"
            >
              No meters match “{query}”
            </li>
          ) : (
            filtered.slice(0, MAX_VISIBLE_OPTIONS * 4).map((option, index) => {
              const isSelected = option.id === value;
              return (
                <li
                  key={option.id}
                  id={`meter-option-${reactId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    // mousedown commits before the input's blur can close
                    // the list — click alone fires after blur dismisses it.
                    e.preventDefault();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm",
                    index === clampedIndex
                      ? "bg-brand-50 dark:bg-brand-900/30"
                      : ""
                  )}
                >
                  <Gauge
                    className="h-3.5 w-3.5 shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text-primary">
                      {option.name}
                    </span>
                    <span className="block truncate font-mono text-xs text-text-muted">
                      {option.id}
                      {option.meta ? ` · ${option.meta}` : ""}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
