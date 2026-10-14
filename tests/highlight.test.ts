import { describe, expect, test } from "vitest";
import { brewBlocks, highlight, pieces } from "../src/highlight";

/// The spans as 'text:role', easier to read than offsets
const roles = (source: string) => highlight(source).map((s) => `${source.slice(s.from, s.to)}:${s.role}`);

describe("highlight", () => {
  test("each word gets its role", () => {
    expect(roles("@V60 15g 250g 94°C\ngrind medium-fine\n0:45 150g ~15s spiral\n1:30 /swirl")).toEqual([
      "@V60:brewer",
      "15g:amount",
      "250g:amount",
      "94°C:temp",
      "grind:kw",
      "medium-fine:grind",
      "0:45:time",
      "150g:amount",
      "~15s:dur",
      "spiral:qual",
      "1:30:time",
      "/swirl:action",
    ]);
  });

  test("the metadata block has keys and values", () => {
    expect(roles("---\ntitle: My V60\n---\n@V60 15g")).toEqual([
      "---:punct",
      "title:fmkey",
      " My V60:fmval",
      "---:punct",
      "@V60:brewer",
      "15g:amount",
    ]);
  });
});

describe("pieces", () => {
    test("the colored words and the plain text between them give back the whole recipe", () => {
        const source = "@V60 15g 250g\n0:00 50g bloom -- wet it all\n";
        const parts = pieces(source);
        expect(parts.map((p) => p.text).join("")).toBe(source);
        expect(parts.filter((p) => p.role).map((p) => `${p.text}:${p.role}`)).toEqual([
            "@V60:brewer",
            "15g:amount",
            "250g:amount",
            "0:00:time",
            "50g:amount",
            "bloom:qual",
            "-- wet it all:comment",
        ]);
    });
});

describe("brewBlocks", () => {
  test("finds the recipe of each ```brew block, and only those", () => {
    const note = "# Notes\n```brew\n@V60 15g\n```\n```js\nx\n```\n~~~~ brew\n@Chemex 30g\n~~~~\n";
    expect(brewBlocks(note).map((b) => note.slice(b.from, b.to))).toEqual(["@V60 15g", "@Chemex 30g"]);
  });

  test("a block not closed yet runs to the end of the note", () => {
    const note = "```brew\n@V60 15g\n0:00";
    expect(brewBlocks(note).map((b) => note.slice(b.from, b.to))).toEqual(["@V60 15g\n0:00"]);
  });

  test("an empty block is empty", () => {
    const note = "```brew\n```";
    expect(brewBlocks(note).map((b) => note.slice(b.from, b.to))).toEqual([""]);
  });
});
