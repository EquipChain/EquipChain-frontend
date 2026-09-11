"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils/cn";

// ============================================================================
// Tabs — accessible tabbed interface
// ============================================================================
// Detail pages (meter, invoice) need to split dense content into panes.
// Building this per-page risks the classic a11y failures: clickable divs,
// missing aria-controls, no keyboard roving. This implements the WAI-ARIA
// tabs pattern with Arrow/Home/End key navigation.

export interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be used within <Tabs>");
  return ctx;
}

export interface TabsProps {
  /** Tab ids in display order */
  tabs: { id: string; label: string; icon?: ReactNode }[];
  /** Initially selected tab id; defaults to the first tab */
  initialTab?: string;
  /** Called when the active tab changes */
  onChange?: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ tabs, initialTab, onChange, children, className }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(initialTab ?? tabs[0]?.id ?? "");
  const baseId = useId();

  const setActiveTab = (id: string) => {
    setActiveTabState(id);
    onChange?.(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab) setActiveTab(nextTab.id);
    // Focus follows selection per the ARIA authoring practices "automatic
    // activation" pattern.
    document.getElementById(`${baseId}-tab-${nextTab?.id}`)?.focus();
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={className}>
        <div role="tablist" aria-label="Content sections" onKeyDown={handleKeyDown} className="flex gap-1 border-b border-border">
          {tabs.map(({ id, label, icon }) => {
            const selected = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-brand-600 text-brand-700 dark:text-brand-300"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabPanelProps {
  /** Must match one of the Tabs `tabs[].id` values */
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
      tabIndex={0}
      className={cn("pt-4 focus-visible:outline-2 focus-visible:outline-brand-500", className)}
    >
      {children}
    </div>
  );
}
