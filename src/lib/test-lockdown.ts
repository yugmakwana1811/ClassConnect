type LockdownKeyEvent = Pick<
  KeyboardEvent,
  "altKey" | "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

const FUNCTION_KEYS = new Set(["f5", "f6", "f11", "f12"]);
const MODIFIER_KEYS = new Set([
  "`",
  "i",
  "j",
  "k",
  "l",
  "n",
  "o",
  "p",
  "r",
  "s",
  "t",
  "u",
  "w",
]);

export function isBlockedTestShortcut(event: LockdownKeyEvent) {
  const key = event.key.toLowerCase();

  if (FUNCTION_KEYS.has(key)) return true;
  if (event.ctrlKey && key === "tab") return true;
  if (event.metaKey && (key === "tab" || key === "`")) return true;
  if (
    event.altKey &&
    ["arrowleft", "arrowright", "home", "tab"].includes(key)
  )
    return true;

  return (event.ctrlKey || event.metaKey) && MODIFIER_KEYS.has(key);
}
