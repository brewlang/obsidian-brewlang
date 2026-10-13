import { describe, expect, test } from "vitest";
import { complete } from "../src/complete";

/// The labels offered with the cursor at the end of the text, and the word they replace
function offered(text: string) {
  const found = complete(text, text.length);
  return found && { word: text.slice(found.from), labels: found.options.map((o) => o.label) };
}

describe("complete", () => {
  test("brewers after '@' at the start of a line", () => {
    const found = offered("@V");
    expect(found?.word).toBe("@V");
    expect(found?.labels).toContain("@V60");
    expect(found?.labels.every((l) => l.toLowerCase().startsWith("@v"))).toBe(true);
  });

  test("actions after '/', allowed with the brewer", () => {
    expect(offered("@V60 15g\n0:30 /sw")?.labels).toContain("/swirl");
    expect(offered("@V60 15g\n0:30 /pr")).toBeUndefined();
    expect(offered("@AeroPress 15g\n0:30 /pr")?.labels).toContain("/press");
  });

  test("grind sizes after 'grind'", () => {
    expect(offered("@V60 15g\ngrind me")?.labels).toContain("medium");
  });

  test("units after a number, by the place in the line: '94c' gives '°C'", () => {
    expect(offered("@V60 15")).toBeUndefined();
    expect(offered("@V60 15g 250g 94c")?.labels).toEqual(["°C"]);
    expect(offered("@V60 15g\n0:00 50~10")).toBeUndefined();
    expect(offered("@V60 15g\n0:00 50g ~10s")).toBeUndefined();
  });

  test("qualifiers after a pour, one technique only", () => {
    expect(offered("@V60 15g\n0:00 50g sp")?.labels).toEqual(["spiral"]);
    expect(offered("@V60 15g\n0:00 50g spiral ce")).toBeUndefined();
  });

  test("keywords at the start of a line", () => {
    expect(offered("@V60 15g\nta")?.labels).toEqual(["target"]);
  });

  test("nothing in the frontmatter, in a comment, or for a word already complete", () => {
    expect(offered("---\ntitle: gr")).toBeUndefined();
    expect(offered("@V60 15g -- gr")).toBeUndefined();
    expect(offered("@V60 15g\n0:00 50g spiral")).toBeUndefined();
  });
});
