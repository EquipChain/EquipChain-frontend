import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./DataTable";
import { StatusBadge } from "./Badge";

interface Row {
  id: string;
  name: string;
  value: number;
  status: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name" },
  { key: "value", header: "Value", align: "right" },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  { key: "actions", header: "Actions", sortable: false, hideOnMobile: true },
];

const rows: Row[] = [
  { id: "a", name: "Alpha", value: 30, status: "Active" },
  { id: "b", name: "Beta", value: 10, status: "Inactive" },
  { id: "c", name: "Gamma", value: 20, status: "Pending" },
];

describe("DataTable", () => {
  it("renders all rows and headers", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        ariaLabel="Test table"
      />
    );
    expect(screen.getByRole("table", { name: "Test table" })).toBeInTheDocument();
    // Rows render in both the desktop table and the mobile card list (both
    // are in the DOM; CSS decides visibility), so assert on multiples.
    for (const name of ["Alpha", "Beta", "Gamma"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it("sorts ascending then descending on repeated header clicks", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        initialSortKey="value"
        ariaLabel="Sort table"
      />
    );
    const valueHeader = screen.getByRole("button", { name: /Value/i });

    // Component starts sorted by value asc (initialSortKey); the first click
    // on the active column toggles to desc — expect 30 (Alpha) first.
    fireEvent.click(valueHeader);
    const bodyRows = within(screen.getByRole("table")).getAllByRole("row");
    expect(bodyRows[1]).toHaveTextContent("Alpha");

    // Second click toggles back to asc — expect 10 (Beta) first
    fireEvent.click(valueHeader);
    expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Beta");
  });

  it("uses a custom sortValue when provided", () => {
    const lengthColumns: DataTableColumn<Row>[] = [
      { key: "name", header: "Name", sortValue: (r) => r.name.length },
    ];
    render(
      <DataTable
        columns={lengthColumns}
        rows={rows}
        getRowId={(r) => r.id}
        initialSortKey="name"
        ariaLabel="Custom sort"
      />
    );
    // "Beta" (4) < "Alpha" (5) = "Gamma" (5) < ...
    const bodyRows = within(screen.getByRole("table")).getAllByRole("row");
    expect(bodyRows[1]).toHaveTextContent("Beta");
  });

  it("renders the empty state when there are no rows", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        emptyMessage="Nothing here yet"
        ariaLabel="Empty table"
      />
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders a loading skeleton with aria-busy", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        loading
        ariaLabel="Loading table"
      />
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const busy = document.querySelector("[aria-busy='true']");
    expect(busy).not.toBeNull();
  });

  it("respects sortable=false columns (header is not a button)", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        ariaLabel="Mixed table"
      />
    );
    expect(screen.queryByRole("button", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  /** Fires a search and flushes the 250ms debounce with real timers. */
  async function search(term: string) {
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: term } });
    await new Promise((r) => setTimeout(r, 400));
  }

  it("filters rows via the search input", async () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        searchable
        ariaLabel="Search table"
      />
    );
    await search("beta");

    // Both desktop and mobile layouts render; Beta should be present in both
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    // Alpha and Gamma should be filtered out entirely
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();
  });

  it("shows a dedicated no-results state for unmatched queries", async () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        searchable
        ariaLabel="No match table"
      />
    );
    await search("zzz");
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  it("respects searchable=false column exclusions", async () => {
    const hiddenCols: DataTableColumn<Row>[] = [
      { key: "name", header: "Name" },
      { key: "status", header: "Status", searchable: false },
    ];
    render(
      <DataTable
        columns={hiddenCols}
        rows={rows}
        getRowId={(r) => r.id}
        searchable
        ariaLabel="Excluded table"
      />
    );
    await search("Active");
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  it("paginates rows and reports the visible range", () => {
    const manyRows: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: `r${i}`,
      name: `Row ${i}`,
      value: i,
      status: "Active",
    }));
    render(
      <DataTable
        columns={[{ key: "name", header: "Name" }]}
        rows={manyRows}
        getRowId={(r) => r.id}
        pageSize={10}
        searchable={false}
        ariaLabel="Paged table"
      />
    );
    expect(screen.getByText("1–10 of 25")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("11–20 of 25")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("21–25 of 25")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("changes page size via the rows-per-page selector", () => {
    const manyRows: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: `r${i}`,
      name: `Row ${i}`,
      value: i,
      status: "Active",
    }));
    render(
      <DataTable
        columns={[{ key: "name", header: "Name" }]}
        rows={manyRows}
        getRowId={(r) => r.id}
        pageSize={10}
        searchable={false}
        ariaLabel="Page size table"
      />
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Rows per page" }), {
      target: { value: "25" },
    });
    expect(screen.getByText("1–25 of 25")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("resets to the first page when the search query changes", async () => {
    const manyRows: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: `r${i}`,
      name: `Row ${i}`,
      value: i,
      status: "Active",
    }));
    render(
      <DataTable
        columns={[{ key: "name", header: "Name" }]}
        rows={manyRows}
        getRowId={(r) => r.id}
        pageSize={10}
        ariaLabel="Reset table"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("11–20 of 25")).toBeInTheDocument();

    await search("Row 2");
    // Filtered set (Row 2, Row 20..24) is one page; pagination resets to page 1
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("supports compact density", () => {
    render(
      <DataTable
        columns={[{ key: "name", header: "Name" }]}
        rows={rows}
        getRowId={(r) => r.id}
        density="compact"
        searchable={false}
        ariaLabel="Dense table"
      />
    );
    const cells = screen.getAllByText("Alpha");
    const cell = cells[0].closest("td");
    expect(cell?.className).toContain("py-1.5");
  });

  it("renders toolbar content next to the search box", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        searchable={false}
        toolbar={<button type="button">Filter</button>}
        ariaLabel="Toolbar table"
      />
    );
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });
});
