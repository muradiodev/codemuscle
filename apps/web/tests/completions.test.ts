import { describe, expect, it } from "vitest";
import { JAVA_KEYWORDS } from "../lib/completions";

describe("Java completion keyword catalog", () => {
  it("contains declarations, control flow, exceptions, and concurrency", () => {
    expect([...JAVA_KEYWORDS]).toEqual(expect.arrayContaining([
      "public",
      "protected",
      "private",
      "class",
      "interface",
      "record",
      "enum",
      "if",
      "else",
      "switch",
      "try",
      "catch",
      "throw",
      "throws",
      "synchronized"
    ]));
  });

  it("contains Java literals", () => {
    expect([...JAVA_KEYWORDS]).toEqual(expect.arrayContaining(["true", "false", "null"]));
  });
});
