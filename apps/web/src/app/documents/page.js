"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import DocumentUpload from "../components/DocumentUpload";

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
        className="w-8 h-8 text-red-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4.5c1.32 0 2.5-.68 2.5-1.5v-1.5c0-.82-1.18-1.5-2.5-1.5S6 13.68 6 14.5V16c0 .82 1.18 1.5 2.5 1.5z" />
      </svg>
    );
  }
  return (
    <svg
      className="w-8 h-8 text-blue-400"
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

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const isDev = process.env.NODE_ENV === "development";

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        // In dev mode, use a mock user instead of redirecting
        if (isDev) {
          setUser({ id: "dev-user", email: "dev@localhost" });
          return;
        }
        router.push("/login");
        return;
      }
      setUser(data.user);
    }

    loadUser();
  }, [router]);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

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
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  const handleUploadSuccess = (results) => {
    // Add newly uploaded documents to the list
    const newDocs = results.map((r) => r.document);
    setDocuments((prev) => [...newDocs, ...prev]);
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Documents</h1>
          <p className="text-gray-400">
            Upload and manage your study materials
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Upload New Document
          </h2>
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Your Documents
            </h2>
            <span className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
              <svg
                className="w-16 h-16 mx-auto text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-400 text-lg mb-2">No documents yet</p>
              <p className="text-gray-600 text-sm">
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-4 bg-slate-900/50 hover:bg-slate-800/50 rounded-xl border border-slate-800 transition-colors"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg">
                    {getFileIcon(doc.file_type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 font-medium truncate">
                      {doc.original_filename}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      {deleting === doc.id ? (
                        <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
