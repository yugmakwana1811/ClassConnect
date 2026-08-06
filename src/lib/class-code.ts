import { randomInt } from "node:crypto";

const CLASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createClassCode() {
  return Array.from(
    { length: 6 },
    () => CLASS_CODE_ALPHABET[randomInt(CLASS_CODE_ALPHABET.length)],
  ).join("");
}
