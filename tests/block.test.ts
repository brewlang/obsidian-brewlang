import { describe, expect, test } from "vitest";
import { renderBlock } from "../src/block";

describe("renderBlock", () => {
  test("a valid recipe is a card with no problem", () => {
    const { html, problems } = renderBlock("@V60 15g 250g 94°C\n0:00 50g bloom\n0:45 250g");
    expect(html).toContain('class="brew-card"');
    expect(problems).toEqual([]);
  });

  test("problems give the line in the block and say what to fix", () => {
    const { html, problems } = renderBlock("@V60 15g\n0:00 50g bloom\n0:45 40g");
    expect(html).toContain('class="brew-card"');
    expect(problems).toEqual([
      { severity: "error", text: "Line 3: The scale is already at 50g: pour to a higher total, or add water with '+'" },
    ]);
  });

  test("warnings and suggestions are kept, with their severity", () => {
    const { problems } = renderBlock("@V60 15g\n0:00 40g\n0:45 250g\n1:00 /swril");
    expect(problems.map((p) => p.severity)).toEqual(["suggestion", "warning"]);
  });

  test("texts are escaped", () => {
    const { html } = renderBlock("---\ntitle: <img src=x onerror=alert(1)>\n---\n@V60 15g\n0:00 250g");
    expect(html).not.toContain("<img");
  });
});
