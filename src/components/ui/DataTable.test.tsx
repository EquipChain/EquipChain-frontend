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
});
