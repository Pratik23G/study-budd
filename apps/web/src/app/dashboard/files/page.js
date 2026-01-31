"use client";

import { useMemo, useState } from "react";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const next = incoming.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type || "unknown",
      addedAt: Date.now(),
    }));

    setFiles((prev) => [...next, ...prev]);
  }

  function onInputChange(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll() {
    setFiles([]);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Files Library</h1>
          <p className="text-slate-600 mt-1">
            Upload and manage your study documents (UI now — storage later).
          </p>
        </div>

        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <input
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg"
              onChange={onInputChange}
            />
            Upload
          </label>

          <button
            onClick={clearAll}
            disabled={files.length === 0}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">Search files</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename..."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Quick stats</p>
          <div className="mt-3 space-y-1 text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total files</span>
              <span className="font-extrabold">{files.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Showing</span>
              <span className="font-extrabold">{filtered.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragActive ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"
        }`}
      >
        <p className="text-slate-900 font-semibold">Drag & drop files here</p>
        <p className="text-slate-600 mt-1 text-sm">
          PDFs, Docs, Slides, Text, CSV/JSON, Images
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-extrabold text-slate-900">Your documents</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl">📁</div>
            <p className="mt-2 font-semibold text-slate-900">No files yet</p>
            <p className="mt-1 text-slate-600">Upload your notes to build your library.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{f.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {f.type} • {formatBytes(f.size)} • added {new Date(f.addedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => alert("Preview UI will come next sprint")}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    onClick={() => removeFile(f.id)}
                  >
                    Remove
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
