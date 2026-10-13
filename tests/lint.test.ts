import { describe, expect, test } from "vitest";
import { lint } from "../src/lint";

/// The problems as 'word:severity', easier to read than offsets
const words = (source: string) => lint(source).map((p) => `${source.slice(p.from, p.to)}:${p.severity}`);

describe("lint", () => {
  test("a valid recipe has no problem", () => {
    expect(lint("@V60 15g 250g 94°C\n0:00 50g bloom\n0:45 250g")).toEqual([]);
  });

  test("each problem is on its word, with the checker's message", () => {
    const [problem] = lint("@V60 15g\n0:00 50g bloom\n0:45 40g");
    expect(problem).toMatchObject({ severity: "error", message: expect.stringContaining("already at 50g") });
    expect(words("@V60 15g\n0:00 50g bloom\n0:45 40g")).toEqual(["40g:error"]);
  });

  test("warnings and suggestions are kept", () => {
    expect(words("@V60 15g\n0:00 40g\n0:45 250g\n1:00 /swril").map((w) => w.split(":").pop())).toEqual([
      "suggestion",
      "warning",
    ]);
  });
});
