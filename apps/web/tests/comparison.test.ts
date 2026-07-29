import { describe, expect, it } from "vitest";
import { compare, tokenize, tokenizeJava } from "../lib/comparison";

describe("browser comparison", () => {
  it("ignores whitespace in syntax mode", () =>
    expect(compare("Map < String,Integer > x;", "Map<String, Integer> x;", "syntax").tokenAccuracy).toBe(
      100
    ));

  it("is formatting-sensitive in strict mode", () =>
    expect(compare("int x;", "int  x;", "strict").tokenAccuracy).toBeLessThan(100));

  it("tracks Java operators as tokens", () =>
    expect(tokenize("a::run && b >= 2")).toEqual(["a", "::", "run", "&&", "b", ">=", "2"]));

  it("strips line and block comments in syntax mode (API parity)", () => {
    const typed = "int x = 1; // ignore me\n/* block */ int y = 2;";
    const reference = "int x = 1;\nint y = 2;";
    expect(compare(typed, reference, "syntax").tokenAccuracy).toBe(100);
    expect(tokenizeJava("int x; // c")).toEqual(["int", "x", ";"]);
    expect(tokenizeJava("int x; /* c */", true)).toContain("/* c */");
  });

  it("keeps ++ and -- as tokens", () =>
    expect(tokenize("i++ + j--")).toEqual(["i", "++", "+", "j", "--"]));
});
