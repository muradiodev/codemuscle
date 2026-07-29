import { describe, expect, it } from "vitest";
import { PASTE_BLOCKED_MESSAGE, pasteBlockFeedback, shouldBlockPaste } from "../lib/paste";

describe("paste blocking", () => {
  it("blocks paste when pasteAllowed is false", () => {
    expect(shouldBlockPaste(false)).toBe(true);
    expect(pasteBlockFeedback(false)).toEqual({
      blocked: true,
      message: PASTE_BLOCKED_MESSAGE
    });
  });

  it("allows paste when pasteAllowed is true", () => {
    expect(shouldBlockPaste(true)).toBe(false);
    expect(pasteBlockFeedback(true)).toEqual({ blocked: false, message: null });
  });
});
