"use client";
import { useState } from "react";
import toast from "react-hot-toast";

interface FileUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FileUpload = ({ onClose, onSuccess }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const reportTypes = [
    { value: "ECG", label: "ECG/EKG" },
    { value: "XRAY", label: "X-Ray" },
    { value: "CT_SCAN", label: "CT Scan" },
    { value: "MRI", label: "MRI" },
    { value: "BLOOD_TEST", label: "Blood Test" },
    { value: "PATHOLOGY", label: "Pathology Report" },
    { value: "OTHER", label: "Other" },
  ];

  const allowedFileTypes: Record<string, string[]> = {
    ECG: ["application/pdf", "image/png", "image/jpeg"],
    XRAY: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
    CT_SCAN: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
    MRI: ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
    BLOOD_TEST: ["application/pdf"],
    PATHOLOGY: ["application/pdf"],
    OTHER: ["application/pdf", "image/png", "image/jpeg", "image/jpg"],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      setFile(selectedFile);
    }
  };

  const validateFile = (): boolean => {
    if (!file) {
      toast.error("Please select a file");
      return false;
    }

    if (!title) {
      toast.error("Please enter a title");
      return false;
    }

    if (!reportType) {
      toast.error("Please select a report type");
      return false;
    }

    // Validate file type for selected report type
    const allowed = allowedFileTypes[reportType];
    if (allowed && !allowed.includes(file.type)) {
      toast.error(
        `Invalid file type for ${reportType}. Allowed types: ${allowed
          .map((t) => t.split("/")[1])
          .join(", ")}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFile()) {
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading file...");

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("reportType", reportType);

      const uploadResponse = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Failed to upload file");
      }

      const reportId = uploadData.report.id;
      setUploadProgress("Analyzing with AI...");

      // Step 2: Automatically trigger AI analysis
      const analysisResponse = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId }),
      });

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        // Upload succeeded but analysis failed - still consider it a success
        console.error("AI analysis failed:", analysisData.error);
        toast.success("Report uploaded successfully! AI analysis will be retried.");
      } else {
        toast.success("Report uploaded and analyzed successfully!");
      }

      // Reset form and close modal
      setFile(null);
      setTitle("");
      setDescription("");
      setReportType("");
      onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload report");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-dark">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-dark dark:text-white">
            Upload Medical Report
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-body-color hover:text-primary disabled:opacity-50 dark:text-dark-6"
          >
            <svg
              className="h-6 w-6"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Report Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Annual Checkup ECG - Jan 2024"
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
              disabled={uploading}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Report Type *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:bg-dark-2"
              disabled={uploading}
              
              required
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or context (optional)"
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
              disabled={uploading}
            ></textarea>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              File Upload *
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stroke border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-body-color dark:text-dark-6"
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
                  {file ? (
                    <p className="mb-2 text-sm text-dark dark:text-white">
                      <span className="font-semibold">{file.name}</span>
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-body-color dark:text-dark-6">
                        <span className="font-semibold">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-body-color dark:text-dark-6">
                        PDF, PNG, or JPEG (MAX. 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={uploading}
                />
              </label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-body-color dark:text-dark-6">
                File size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {uploading && (
            <div className="rounded-md bg-primary/10 p-4 dark:bg-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm font-medium text-dark dark:text-white">
                  {uploadProgress}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-md border border-stroke px-6 py-3 text-base font-medium text-dark transition hover:bg-gray-50 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload & Analyze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUpload;
