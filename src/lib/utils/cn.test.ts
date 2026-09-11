import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, 0, "b")).toBe("a b");
  });

  it("supports conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("merges Tailwind conflicts keeping the last utility", () => {
    expect(cn("px-4 py-2", "px-2")).toBe("py-2 px-2");
  });

  it("resolves conflicting color/width utilities", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("w-full", "w-1/2")).toBe("w-1/2");
  });

  it("keeps non-conflicting classes from both inputs", () => {
    expect(cn("px-4 py-2 rounded-lg", "hover:bg-blue-500")).toBe(
      "px-4 py-2 rounded-lg hover:bg-blue-500"
    );
  });

  it("deduplicates repeated classes", () => {
    expect(cn("p-2", "p-2")).toBe("p-2");
  });

  it("handles nested arrays", () => {
    expect(cn(["a", "b"], ["c"])).toBe("a b c");
  });

  it("returns an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles arbitrary-value utilities", () => {
    expect(cn("w-[100px]", "w-[200px]")).toBe("w-[200px]");
  });
});
