import { describe, expect, it } from "vitest";
import { generateCSV } from "./csv";

describe("generateCSV", () => {
  it("generates header + rows with default options", () => {
    const csv = generateCSV(
      [
        { name: "Main Building", reading: 100 },
        { name: "Warehouse A", reading: 200 },
      ],
      {
        columns: [
          { header: "Name", accessor: "name" },
          { header: "Reading", accessor: "reading" },
        ],
      }
    );
    expect(csv).toContain("Name,Reading");
    expect(csv).toContain("Main Building,100");
    expect(csv).toContain("Warehouse A,200");
  });

  it("quotes cells containing commas, quotes, and newlines", () => {
    const csv = generateCSV([{ note: 'has "quotes" and, commas' }], {
      columns: [{ header: "Note", accessor: "note" }],
      includeBOM: false,
    });
    expect(csv).toContain('"has ""quotes"" and, commas"');
  });

  it("prepends a BOM by default for Excel compatibility", () => {
    const csv = generateCSV([{ a: 1 }], {
      columns: [{ header: "A", accessor: "a" }],
    });
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  // ---------------------------------------------------------------------
  // CSV injection (OWASP)
  // ---------------------------------------------------------------------

  it.each(["=cmd()", "+SUM(A1)", "@MACRO", "-1+1"])(
    "neutralizes formula-prefixed cell %s",
    (payload) => {
      const csv = generateCSV([{ name: payload }], {
        columns: [{ header: "Name", accessor: "name" }],
        includeBOM: false,
      });
      expect(csv).toContain(`'${payload}`);
      expect(csv).not.toMatch(/(^|,)=/);
    }
  );

  it("leaves safe values unmodified", () => {
    const csv = generateCSV([{ name: "meter-001", reading: 1250 }], {
      columns: [
        { header: "Name", accessor: "name" },
        { header: "Reading", accessor: "reading" },
      ],
      includeBOM: false,
    });
    expect(csv).toContain("meter-001");
    expect(csv).toContain("1250");
  });

  it("strips control characters from cells", () => {
    const csv = generateCSV([{ name: "bad\u0007value" }], {
      columns: [{ header: "Name", accessor: "name" }],
      includeBOM: false,
    });
    expect(csv).toContain("badvalue");
  });

  it("renders null and undefined as empty cells", () => {
    const csv = generateCSV([{ a: null, b: undefined }], {
      columns: [
        { header: "A", accessor: "a" },
        { header: "B", accessor: "b" },
      ],
      includeBOM: false,
    });
    expect(csv).toBe("A,B\r\n,");
  });
});
