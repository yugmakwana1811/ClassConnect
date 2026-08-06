import "server-only";
import { del, head, put } from "@vercel/blob";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { UserFacingError } from "@/lib/user-facing-error";

export const MAX_ANSWER_PAGE_SIZE = 10 * 1024 * 1024;
export const LOCAL_PRIVATE_FILE_PREFIX = "local-private://";
const MAX_SERVER_UPLOAD_SIZE = 3 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

export function validateFile(file: File, imageOnly = false) {
  if (!file.size) throw new UserFacingError("The selected file is empty.");
  if (file.size > MAX_SERVER_UPLOAD_SIZE)
    throw new UserFacingError("Files must be 3 MB or smaller.");
  if (!ALLOWED.has(file.type) || (imageOnly && !file.type.startsWith("image/")))
    throw new UserFacingError(
      imageOnly
        ? "Upload a JPG, PNG, or WebP image."
        : "Upload a JPG, PNG, WebP, PDF, or text file.",
    );
}
export async function verifyPrivateUpload(
  url: string,
  expectedPrefix: string,
  imageOnly = false,
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new UserFacingError("File storage is not configured.");
  const metadata = await head(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!metadata.pathname.startsWith(expectedPrefix))
    throw new UserFacingError(
      "The uploaded file does not belong to this assignment.",
    );
  if (
    !ALLOWED.has(metadata.contentType) ||
    (imageOnly && !metadata.contentType.startsWith("image/"))
  )
    throw new UserFacingError("The uploaded file type is not supported.");
  if (
    !metadata.size ||
    metadata.size > (imageOnly ? MAX_ANSWER_PAGE_SIZE : MAX_SERVER_UPLOAD_SIZE)
  )
    throw new UserFacingError("The uploaded file exceeds the allowed size.");
  return metadata;
}
export async function storeFile(file: File, folder: string) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filename = `${folder}/${randomUUID()}-${safeName}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  if (process.env.NODE_ENV === "production")
    throw new UserFacingError(
      "File storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
    );
  const dir = path.join(process.cwd(), ".data", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, path.basename(filename)),
    Buffer.from(await file.arrayBuffer()),
  );
  return `${LOCAL_PRIVATE_FILE_PREFIX}${folder}/${path.basename(filename)}`;
}

export async function deleteStoredFile(url: string) {
  if (url.startsWith(LOCAL_PRIVATE_FILE_PREFIX)) {
    try {
      await unlink(localPrivatePath(url));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return;
  }
  if (!url.startsWith("https://")) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new UserFacingError("File storage is not configured.");
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export async function readLocalPrivateFile(url: string) {
  return readFile(localPrivatePath(url));
}

function localPrivatePath(url: string) {
  if (!url.startsWith(LOCAL_PRIVATE_FILE_PREFIX))
    throw new Error("Unknown local file reference.");
  const relativePath = url.slice(LOCAL_PRIVATE_FILE_PREFIX.length);
  const root = path.resolve(process.cwd(), ".data", "uploads");
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`))
    throw new Error("Invalid local file reference.");
  return resolved;
}
