"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

// ============================================================================
// DataTable — sortable, accessible, responsive data table
// ============================================================================
// Every page hand-rolled its own <table> with identical markup and zero
// functionality: no sorting, no empty state, no mobile strategy (wide tables
// simply overflowed on phones). This primitive centralizes the chrome and
// adds keyboard-accessible sorting, aria-sort semantics, a real empty state,
// a loading skeleton, and a card layout under the md breakpoint.

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
  /** Small caption under the table, e.g. "12 meters" */
  caption?: string;
  /** Accessible name for the table element */
  ariaLabel: string;
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

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  initialSortKey,
  initialSortDirection = "asc",
  loading = false,
  emptyMessage = "No records found.",
  caption,
  ariaLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [direction, setDirection] = useState<SortDirection>(initialSortDirection);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return rows;
    const getValue = column.sortValue ?? ((row: T) => defaultSortValue(row, sortKey));
    const sorted = [...rows].sort((a, b) => compareValues(getValue(a), getValue(b)));
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [rows, sortKey, direction, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
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
    return <EmptyState title={emptyMessage} />;
  }

  const mobileTitleKey =
    columns.find((c) => c.mobileTitle)?.key ?? columns[0]?.key;
  const mobileColumns = columns.filter(
    (c) => !c.hideOnMobile && c.key !== mobileTitleKey
  );

  return (
    <div className="space-y-2">
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
                    className={`px-4 py-3 font-medium text-text-secondary ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
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
            {sortedRows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-border-light transition-colors last:border-0 hover:bg-surface-secondary"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${
                      col.align === "right" ? "text-right" : "text-left"
                    } ${col.key === mobileTitleKey ? "font-medium text-text-primary" : "text-text-secondary"}`}
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
        {sortedRows.map((row) => {
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

      {caption && (
        <p className="text-xs text-text-muted">{caption}</p>
      )}
    </div>
  );
}
