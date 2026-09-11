"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/src/lib/utils/cn";
import { useDebouncedValue } from "@/src/lib/hooks/useDebouncedValue";

// ============================================================================
// DataTable — sortable, searchable, paginated, accessible data table
// ============================================================================
// Every page hand-rolled its own <table> with identical markup and zero
// functionality: no sorting, no filtering, no pagination (every row renders
// no matter how many exist), no empty state, no mobile strategy. This
// primitive centralizes the chrome and adds keyboard-accessible sorting,
// aria-sort semantics, debounced global search, page-size-aware pagination,
// a real empty state, a loading skeleton, and a card layout under the md
// breakpoint.

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  /** Stable key; must match a property of the row for default sorting */
  key: string;
  /** Column header label */
  header: string;
  /** Renders the cell content for a row (defaults to the raw value) */
  cell?: (row: T) => ReactNode;
  /** Marks this column's value as the title line in mobile card layout */
  mobileTitle?: boolean;
  /** Hide this column in the mobile card layout */
  hideOnMobile?: boolean;
  /** Left-align (default) or right-align the column */
  align?: "left" | "right";
  /** Disables sorting for columns like actions */
  sortable?: boolean;
  /** Custom sort comparator; defaults to comparing the raw values */
  sortValue?: (row: T) => string | number;
  /** Excludes this column from global search (e.g. action columns) */
  searchable?: boolean;
  /** Plain-text representation used for search matching */
  searchValue?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Stable row identity */
  getRowId: (row: T) => string;
  /** Initial sort column key */
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  /** Shows the loading skeleton instead of rows */
  loading?: boolean;
  /** Shown when rows is empty and not loading */
  emptyMessage?: string;
  /** Secondary hint under emptyMessage; also used when a search finds nothing */
  emptyDescription?: string;
  /** Small caption under the table, e.g. "12 meters" */
  caption?: string;
  /** Accessible name for the table element */
  ariaLabel: string;
  /** Shows the global search input (default true when rows > 5) */
  searchable?: boolean;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Rows per page; 0 disables pagination entirely */
  pageSize?: number;
  /** Row density preset */
  density?: "compact" | "normal";
  /** Extra toolbar content rendered left of the search box */
  toolbar?: ReactNode;
}

function defaultSortValue<T>(row: T, key: string): string | number {
  const value = (row as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  return String(value ?? "");
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

const DENSITY_CLASSES = {
  compact: "px-3 py-1.5",
  normal: "px-4 py-3",
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  initialSortKey,
  initialSortDirection = "asc",
  loading = false,
  emptyMessage = "No records found.",
  emptyDescription,
  caption,
  ariaLabel,
  searchable,
  searchPlaceholder = "Search…",
  pageSize = 10,
  density = "normal",
  toolbar,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [direction, setDirection] = useState<SortDirection>(initialSortDirection);
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const debouncedQuery = useDebouncedValue(query, 250);

  const isSearchable = searchable ?? rows.length > 5;

  const filteredRows = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        if (col.searchable === false) return false;
        const text = col.searchValue
          ? col.searchValue(row)
          : String((row as Record<string, unknown>)[col.key] ?? "");
        return text.toLowerCase().includes(q);
      })
    );
  }, [rows, debouncedQuery, columns]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredRows;
    const getValue = column.sortValue ?? ((row: T) => defaultSortValue(row, sortKey));
    const sorted = [...filteredRows].sort((a, b) => compareValues(getValue(a), getValue(b)));
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [filteredRows, sortKey, direction, columns]);

  const totalRows = sortedRows.length;
  const pageCount = rowsPerPage > 0 ? Math.max(1, Math.ceil(totalRows / rowsPerPage)) : 1;
  // Clamping instead of a setState-in-effect reset: when the result set
  // shrinks (search/resize), the requested page naturally falls back into
  // range without an extra render pass. Pagination controls always write
  // explicit page numbers, so no stale-page state can persist.
  const safePageIndex = Math.min(requestedPage, pageCount - 1);
  const visibleRows =
    rowsPerPage > 0
      ? sortedRows.slice(safePageIndex * rowsPerPage, (safePageIndex + 1) * rowsPerPage)
      : sortedRows;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
    setRequestedPage(0);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface" aria-busy="true">
        <div className="space-y-3 p-4">
          <Skeleton className="w-1/3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState title={emptyMessage} description={emptyDescription} />
    );
  }

  const mobileTitleKey =
    columns.find((c) => c.mobileTitle)?.key ?? columns[0]?.key;
  const mobileColumns = columns.filter(
    (c) => !c.hideOnMobile && c.key !== mobileTitleKey
  );
  const cellPadding = DENSITY_CLASSES[density];

  const rangeStart = rowsPerPage > 0 ? safePageIndex * rowsPerPage + 1 : 1;
  const rangeEnd = rowsPerPage > 0 ? Math.min((safePageIndex + 1) * rowsPerPage, totalRows) : totalRows;

  return (
    <div className="space-y-2">
      {(isSearchable || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          {isSearchable && (
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <Input
                type="search"
                role="searchbox"
                aria-label={`Search ${ariaLabel}`}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <table className="w-full text-sm" aria-label={ariaLabel}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-border bg-surface-secondary">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const ariaSort: "ascending" | "descending" | "none" = isSorted
                  ? direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "font-medium text-text-secondary",
                      cellPadding,
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 rounded transition-colors hover:text-text-primary ${
                          isSorted ? "text-text-primary" : ""
                        }`}
                      >
                        {col.header}
                        {isSorted ? (
                          direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-border-light transition-colors last:border-0 hover:bg-surface-secondary"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPadding,
                      col.align === "right" ? "text-right" : "text-left",
                      col.key === mobileTitleKey
                        ? "font-medium text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list instead of an overflowing table */}
      <ul className="space-y-3 md:hidden">
        {visibleRows.map((row) => {
          const title = mobileTitleKey
            ? String((row as Record<string, unknown>)[mobileTitleKey] ?? "")
            : "";
          return (
            <li
              key={getRowId(row)}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="mb-2 font-medium text-text-primary">{title}</p>
              <dl className="space-y-1.5">
                {mobileColumns.map((col) => (
                  <div key={col.key} className="flex items-baseline justify-between gap-4">
                    <dt className="text-xs text-text-muted">{col.header}</dt>
                    <dd className="text-sm text-text-secondary">
                      {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      {debouncedQuery && totalRows === 0 ? (
        <EmptyState
          title={`No results for "${debouncedQuery}"`}
          description="Try a different search term or clear the filter."
          bare
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {caption && <p className="text-xs text-text-muted">{caption}</p>}
          {(rowsPerPage > 0 && totalRows > 0) && (
            <nav
              aria-label={`${ariaLabel} pagination`}
              className="flex items-center gap-2 text-xs text-text-muted"
            >
              <span aria-live="polite">
                {rangeStart}–{rangeEnd} of {totalRows}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRequestedPage((p) => Math.max(0, Math.min(p, pageCount - 1) - 1))}
                disabled={safePageIndex === 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span aria-current="page">
                Page {safePageIndex + 1} of {pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRequestedPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePageIndex >= pageCount - 1}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <label className="ml-2 flex items-center gap-1">
                <span className="sr-only">Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs text-text-secondary"
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                  <option value={0}>All</option>
                </select>
              </label>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
