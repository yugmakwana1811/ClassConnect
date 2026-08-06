import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const PARENT_ACCESS_CODE_LENGTH = 10;

export function generateParentAccessCode() {
  const bytes = randomBytes(PARENT_ACCESS_CODE_LENGTH);
  return Array.from(
    bytes,
    (byte) => ALPHABET[byte % ALPHABET.length],
  ).join("");
}
