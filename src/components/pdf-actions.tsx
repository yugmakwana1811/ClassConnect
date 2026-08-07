"use client";

import { useState } from "react";
import { Download, Eye, FileKey2, LoaderCircle, X } from "lucide-react";

function downloadUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}

export function PdfActions({
  studentUrl,
  teacherUrl,
  label = "PDF",
}: {
  studentUrl: string;
  teacherUrl?: string;
  label?: string;
}) {
  const [preview, setPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  function open(url: string, title: string) {
    setFailed(false);
    setLoading(true);
    setPreview({ url, title });
  }

  return (
    <div className="pdf-actions">
      <div className="pdf-action-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => open(studentUrl, `${label} - student version`)}
        >
          <Eye size={16} /> Preview PDF
        </button>
        <a className="btn btn-secondary" href={downloadUrl(studentUrl)}>
          <Download size={16} /> Download
        </a>
        {teacherUrl ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => open(teacherUrl, `${label} - teacher key`)}
            >
              <FileKey2 size={16} /> Preview key
            </button>
            <a className="btn btn-secondary" href={downloadUrl(teacherUrl)}>
              <Download size={16} /> Teacher key
            </a>
          </>
        ) : null}
      </div>
      {preview ? (
        <section className="pdf-preview" aria-label={preview.title}>
          <div className="pdf-preview-head">
            <div>
              <div className="eyebrow">Protected preview</div>
              <strong>{preview.title}</strong>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPreview(null)}
              aria-label="Close PDF preview"
            >
              <X size={16} /> Close
            </button>
          </div>
          {loading ? (
            <div className="pdf-preview-status" role="status">
              <LoaderCircle className="pdf-preview-spinner" size={22} />
              Preparing the document…
            </div>
          ) : null}
          {failed ? (
            <div className="alert alert-error" role="alert">
              The preview could not be loaded. Use Download to open the PDF in
              your browser.
            </div>
          ) : null}
          <iframe
            src={preview.url}
            title={preview.title}
            className="pdf-preview-frame"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
