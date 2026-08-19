import "server-only";
import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import {
  LOCAL_PRIVATE_FILE_PREFIX,
  readLocalPrivateFile,
} from "@/lib/storage";

export async function storedFileResponse(
  request: NextRequest,
  url: string,
  name: string,
  mimeType?: string,
) {
  if (url.startsWith("/") && !url.startsWith("//"))
    return NextResponse.redirect(new URL(url, request.url));
  if (url.startsWith("//"))
    return NextResponse.json({ error: "Invalid file reference" }, { status: 400 });
  if (url.startsWith(LOCAL_PRIVATE_FILE_PREFIX)) {
    try {
      const file = await readLocalPrivateFile(url);
      return new Response(new Uint8Array(file), {
        headers: privateFileHeaders(name, mimeType, file.byteLength),
      });
    } catch (error) {
      console.error(
        "[ClassConnect] Local private file delivery failed",
        error instanceof Error ? error.message : "Unknown local storage error",
      );
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const blobConfigured = Boolean(
    blobToken || (process.env.VERCEL === "1" && process.env.BLOB_STORE_ID?.trim()),
  );
  if (!blobConfigured)
    return NextResponse.json(
      { error: "Private storage is not configured" },
      { status: 503 },
    );
  try {
    const blob = await get(url, {
      access: "private",
      ...(blobToken ? { token: blobToken } : {}),
    });
    if (!blob?.stream)
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    const headers = new Headers();
    blob.headers.forEach((value, key) => headers.set(key, value));
    const contentType = headers.get("content-type");
    if (
      contentType?.toLowerCase().startsWith("text/") &&
      !/charset=/i.test(contentType)
    )
      headers.set("Content-Type", `${contentType}; charset=utf-8`);
    const protectedHeaders = privateFileHeaders(name, contentType ?? mimeType);
    protectedHeaders.forEach((value, key) => headers.set(key, value));
    return new Response(blob.stream, { headers });
  } catch (error) {
    console.error(
      "[ClassConnect] Private file delivery failed",
      error instanceof Error ? error.message : "Unknown storage error",
    );
    return NextResponse.json(
      { error: "File could not be loaded" },
      { status: 502 },
    );
  }
}

function privateFileHeaders(name: string, mimeType?: string, size?: number) {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `inline; filename="download"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Content-Type": mimeType || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (typeof size === "number") headers.set("Content-Length", String(size));
  if (mimeType?.toLowerCase().startsWith("text/") && !/charset=/i.test(mimeType))
    headers.set("Content-Type", `${mimeType}; charset=utf-8`);
  return headers;
}
