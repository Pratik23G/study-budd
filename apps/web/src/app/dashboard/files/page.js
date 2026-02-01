"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import DocumentUpload from "../../components/DocumentUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(fileType) {
  if (fileType === "pdf") {
    return (
      <svg
        className="w-8 h-8 text-red-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4.5c1.32 0 2.5-.68 2.5-1.5v-1.5c0-.82-1.18-1.5-2.5-1.5S6 13.68 6 14.5V16c0 .82 1.18 1.5 2.5 1.5z" />
      </svg>
    );
  }
  if (fileType === "png" || fileType === "jpeg" || fileType === "jpg") {
    return (
      <svg
        className="w-8 h-8 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-8 h-8 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function FilesPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isDev = process.env.NODE_ENV === "development";
      const accessToken = session?.access_token || (isDev ? "dev-token" : null);

      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/documents`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      d.original_filename?.toLowerCase().includes(q)
    );
  }, [documents, query]);

  // Handle successful upload
  const handleUploadSuccess = (results) => {
    const newDocs = results.map((r) => r.document);
    setDocuments((prev) => [...newDocs, ...prev]);
  };

  // Handle document deletion
  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeleting(documentId);

    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isDev = process.env.NODE_ENV === "development";
      const accessToken = session?.access_token || (isDev ? "dev-token" : null);

      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Files Library
          </h1>
          <p className="text-slate-600 mt-1">
            Upload and manage your study documents.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">
            Search files
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Quick stats</p>
          <div className="mt-3 space-y-1 text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total files</span>
              <span className="font-extrabold">{documents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Showing</span>
              <span className="font-extrabold">{filtered.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Upload New Document
        </h2>
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-extrabold text-slate-900">Your documents</h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 mt-4">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl">📁</div>
            <p className="mt-2 font-semibold text-slate-900">No files yet</p>
            <p className="mt-1 text-slate-600">
              Upload your notes to build your library.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* File Icon */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg">
                  {getFileIcon(doc.file_type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {doc.original_filename}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.file_type?.toUpperCase()} •{" "}
                    {formatFileSize(doc.file_size)} •{" "}
                    {formatDate(doc.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting === doc.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
