import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  sanitizeString,
  sanitizeObject,
  sanitizeUrl,
  sanitizeFileName,
  sanitizeSqlInput,
} from "./sanitize";

describe("escapeHtml", () => {
  it("escapes all dangerous HTML characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src&#x3D;x onerror&#x3D;&quot;alert(1)&quot;&gt;"
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Hello world 123")).toBe("Hello world 123");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });
});

describe("sanitizeString", () => {
  it("removes script tags and their content", () => {
    const out = sanitizeString(`hello<script>alert(1)</script>world`);
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
    expect(out).toContain("hello");
    expect(out).toContain("world");
  });

  it("removes event handler attributes", () => {
    const out = sanitizeString(`<div onclick="evil()">text</div>`);
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("evil()");
  });

  it("neutralizes javascript: URLs", () => {
    expect(sanitizeString("javascript:alert(1)")).not.toContain("javascript:");
  });

  it("escapes remaining HTML after stripping", () => outputEscaped());
  function outputEscaped() {
    const out = sanitizeString(`<b>bold</b>`);
    expect(out).not.toContain("<b>");
    expect(out).toContain("&lt;b&gt;");
  }
});

describe("sanitizeObject", () => {
  it("sanitizes nested string values recursively", () => {
    const input = {
      name: "<script>x</script>meter",
      meta: { note: "ok", tags: ["a<b", "c"] },
      count: 5,
      flag: true,
    };
    const out = sanitizeObject(input);
    expect(out.name).not.toContain("<script>");
    expect(out.meta.note).toBe("ok");
    expect(out.meta.tags[0]).not.toContain("<");
    expect(out.count).toBe(5);
    expect(out.flag).toBe(true);
  });
});

describe("sanitizeUrl", () => {
  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("allows relative URLs", () => {
    expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeUrl("./relative")).toBe("./relative");
  });

  it("blocks javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("blocks data: protocol", () => {
    expect(sanitizeUrl("data:text/html,<h1>hi</h1>")).toBe("");
  });

  it("blocks unknown protocols", () => {
    expect(sanitizeUrl("ftp://files.example.com")).toBe("");
  });
});

describe("sanitizeFileName", () => {
  it("removes path traversal sequences", () => {
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
  });

  it("replaces invalid filename characters", () => {
    expect(sanitizeFileName(`report: "final"? *.csv`)).toBe(
      "report_ _final__ _.csv"
    );
  });

  it("strips leading dots (hidden files)", () => {
    expect(sanitizeFileName(".env")).toBe("env");
  });

  it("caps length at 255 characters", () => {
    const long = "a".repeat(400);
    expect(sanitizeFileName(long)).toHaveLength(255);
  });

  it("falls back to 'unnamed' for empty results", () => {
    expect(sanitizeFileName("...")).toBe("unnamed");
  });
});

describe("sanitizeSqlInput", () => {
  it("removes SQL comment markers", () => {
    expect(sanitizeSqlInput("1; -- DROP TABLE users")).not.toContain("--");
  });

  it("strips common SQL keywords", () => {
    const out = sanitizeSqlInput("DROP TABLE users");
    expect(out.toUpperCase()).not.toContain("DROP");
  });
});
