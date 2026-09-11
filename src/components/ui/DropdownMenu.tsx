"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// DropdownMenu — accessible action menu
// ============================================================================
// Row-level actions (export single record, copy ID, pause stream) need a
// menu that closes on Escape/outside click, supports arrow-key navigation,
// and restores focus to the trigger. Without this primitive each consumer
// would reinvent the focus bookkeeping — or ship buttons that trap focus.

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Renders the item in the destructive style */
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownMenuProps {
  /** Accessible name for the trigger button */
  triggerLabel: string;
  /** Icon for the trigger button */
  triggerIcon?: ReactNode;
  items: DropdownMenuItem[];
  /** Horizontal alignment of the popover */
  align?: "left" | "right";
}

interface MenuContextValue {
  close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function DropdownMenu({
  triggerLabel,
  triggerIcon,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = () => setOpen(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      if (!open) {
        event.preventDefault();
        setOpen(true);
      }
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    const focusable = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
    );
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      // Return focus to the trigger
      containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = focusable.findIndex((el) => el === document.activeElement);
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % focusable.length
          : (currentIndex - 1 + focusable.length) % focusable.length;
      focusable[nextIndex]?.focus();
    }
  };

  return (
    <MenuContext.Provider value={{ close }}>
      <div
        ref={containerRef}
        className="relative inline-block"
        onKeyDown={handleMenuKeyDown}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={triggerLabel}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleTriggerKeyDown}
          className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {triggerIcon ?? "⋯"}
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            aria-label={triggerLabel}
            className={cn(
              "absolute z-50 mt-1 min-w-40 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.();
                  close();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40",
                  item.destructive
                    ? "text-error hover:bg-error-light/30"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}
