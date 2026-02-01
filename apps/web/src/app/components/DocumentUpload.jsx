"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DocumentUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file) => {
    const supabase = createSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // In development, allow using a dev token if no session exists
    const isDev = process.env.NODE_ENV === "development";
    const devToken = process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN || "dev-token";
    const accessToken = session?.access_token || (isDev ? devToken : null);

    if (!accessToken) {
      throw new Error("You must be logged in to upload documents");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to upload document");
    }

    return response.json();
  };

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorMessages = rejection.errors.map((e) => e.message).join(", ");
        setError(errorMessages);
        return;
      }

      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        const results = [];
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          setUploadProgress(Math.round(((i + 0.5) / acceptedFiles.length) * 100));

          const result = await uploadFile(file);
          results.push(result);

          setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
        }

        if (onUploadSuccess) {
          onUploadSuccess(results);
        }
      } catch (err) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      multiple: true,
      disabled: uploading,
    });

  const getBorderColor = () => {
    if (isDragReject) return "border-red-400";
    if (isDragActive) return "border-indigo-500";
    return "border-slate-200";
  };

  const getBackgroundColor = () => {
    if (isDragReject) return "bg-red-50";
    if (isDragActive) return "bg-indigo-50";
    return "bg-slate-50";
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          ${getBorderColor()}
          ${getBackgroundColor()}
          ${uploading ? "opacity-70 cursor-not-allowed" : "hover:border-indigo-400 hover:bg-indigo-50"}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Upload icon */}
          <div
            className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragActive ? "bg-indigo-100" : "bg-slate-100"}
            transition-colors duration-200
          `}
          >
            <svg
              className={`w-8 h-8 ${isDragActive ? "text-indigo-600" : "text-slate-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {uploading ? (
            <div className="space-y-2">
              <p className="text-slate-700 font-medium">Uploading...</p>
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-slate-800 font-medium text-lg">
                  {isDragActive
                    ? "Drop your files here"
                    : "Drag & drop your documents"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  or click to browse
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-600 border border-slate-200">
                  PDF
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-600 border border-slate-200">
                  PNG
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-600 border border-slate-200">
                  JPEG
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Maximum file size: 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
