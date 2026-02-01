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
  if (fileType === "image") {
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

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDFs" },
  { id: "image", label: "Images" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "name-asc", label: "Name A-Z" },
  { id: "name-desc", label: "Name Z-A" },
  { id: "size", label: "Size" },
];

export default function FilesPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");

  // New state for modal, filter, and sort
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsUploadOpen(false);
      }
    };
    if (isUploadOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isUploadOpen]);

  // Filter and sort documents
  const filtered = useMemo(() => {
    let result = [...documents];

    // Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((d) =>
        d.original_filename?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (activeFilter === "pdf") {
      result = result.filter((d) => d.file_type === "pdf");
    } else if (activeFilter === "image") {
      result = result.filter((d) => d.file_type === "image");
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "name-asc":
        result.sort((a, b) =>
          (a.original_filename || "").localeCompare(b.original_filename || "")
        );
        break;
      case "name-desc":
        result.sort((a, b) =>
          (b.original_filename || "").localeCompare(a.original_filename || "")
        );
        break;
      case "size":
        result.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
        break;
      default:
        break;
    }

    return result;
  }, [documents, query, activeFilter, sortBy]);

  // Handle successful upload
  const handleUploadSuccess = (results) => {
    const newDocs = results.map((r) => r.document);
    setDocuments((prev) => [...newDocs, ...prev]);
    setIsUploadOpen(false);
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
    <div className="space-y-4">
      {/* Consolidated Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Files Library</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:max-w-xl sm:ml-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Filter/Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveFilter(option.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeFilter === option.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* File count */}
          <span className="text-sm text-slate-500">
            Showing {filtered.length} of {documents.length} file
            {documents.length !== 1 ? "s" : ""}
          </span>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 mt-4">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl">📁</div>
            <p className="mt-2 font-semibold text-slate-900">
              {documents.length === 0 ? "No files yet" : "No matching files"}
            </p>
            <p className="mt-1 text-slate-600">
              {documents.length === 0
                ? "Upload your notes to build your library."
                : "Try adjusting your search or filters."}
            </p>
            {documents.length === 0 && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload your first file
              </button>
            )}
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

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsUploadOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2
                id="upload-modal-title"
                className="text-lg font-extrabold text-slate-900"
              >
                Upload Documents
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
