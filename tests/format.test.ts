import { describe, expect, it } from "vitest";
import {
  displayLink,
  formatDateRange,
  formatMonth,
  initials,
  safeHref,
  slugify,
} from "@/lib/resume/format";

describe("date formatting", () => {
  it("formats YYYY-MM without timezone drift", () => {
    expect(formatMonth("2024-01")).toBe("Jan 2024");
    expect(formatMonth("2024-12")).toBe("Dec 2024");
    expect(formatMonth("")).toBe("");
    expect(formatMonth("2024-13")).toBe("");
  });

  it("builds readable ranges", () => {
    expect(formatDateRange("2022-03", "", true)).toBe("Mar 2022 — Present");
    expect(formatDateRange("2019-01", "2021-11")).toBe("Jan 2019 — Nov 2021");
    expect(formatDateRange("", "", false)).toBe("");
    expect(formatDateRange("2020-05", "", false)).toBe("May 2020");
  });
});

describe("links", () => {
  it("only accepts http and https", () => {
    expect(safeHref("example.com")).toBe("https://example.com/");
    expect(safeHref("https://example.com/portfolio")).toBe(
      "https://example.com/portfolio",
    );
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("mailto:hello@example.com")).toBeNull();
  });

  it("removes protocol noise for display", () => {
    expect(displayLink("https://averysinclair.design/")).toBe(
      "averysinclair.design",
    );
  });
});

describe("text helpers", () => {
  it("derives initials", () => {
    expect(initials("Avery Sinclair")).toBe("AS");
    expect(initials("Avery")).toBe("AV");
    expect(initials("")).toBe("·");
  });

  it("slugifies file names safely", () => {
    expect(slugify("Avery Sinclair — Résumé")).toBe("avery-sinclair-resume");
    expect(slugify("!!!")).toBe("resume");
  });
});
