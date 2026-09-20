import { describe, expect, it } from "vitest";
import { PYTHON_KEYWORDS, pythonSymbolsFromReference } from "../lib/pythonCompletions";

describe("Python completions", () => {
  it("includes modern control-flow and async keywords", () => {
    expect([...PYTHON_KEYWORDS]).toEqual(
      expect.arrayContaining(["async", "await", "match", "case", "yield"])
    );
  });

  it("extracts code symbols without comments or string content", () => {
    const symbols = pythonSymbolsFromReference(
      'class InvoiceService:\n    # hidden_comment\n    label = "hidden_string"\n'
    );
    expect(symbols).toContain("InvoiceService");
    expect(symbols).not.toContain("hidden_comment");
    expect(symbols).not.toContain("hidden_string");
  });
});
