import { describe, expect, it } from "vitest";
import { getReferenceBlock } from "../lib/referenceBlock";

describe("getReferenceBlock", () => {
  it("returns a method-sized region around the typed line", () => {
    const source = [
      "package demo;",
      "",
      "public class Demo {",
      "  public void one() {",
      "    int a = 1;",
      "  }",
      "",
      "  public void two() {",
      "    int b = 2;",
      "  }",
      "}"
    ].join("\n");

    const block = getReferenceBlock(source, 5);
    expect(block).toContain("public void one()");
    expect(block).not.toContain("public void two()");
  });
});
