export const PASTE_BLOCKED_MESSAGE =
  "Manual practice mode is active. Pasting is disabled for this session.";

/** Returns whether a paste event should be blocked under current settings. */
export function shouldBlockPaste(pasteAllowed: boolean): boolean {
  return !pasteAllowed;
}

export function pasteBlockFeedback(pasteAllowed: boolean): { blocked: boolean; message: string | null } {
  if (!shouldBlockPaste(pasteAllowed)) return { blocked: false, message: null };
  return { blocked: true, message: PASTE_BLOCKED_MESSAGE };
}
