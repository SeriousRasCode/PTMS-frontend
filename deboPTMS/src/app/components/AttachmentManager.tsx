import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { attachmentAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Upload, File, Trash2, Download, Paperclip } from "lucide-react";

interface Attachment {
  id: number;
  project_id?: number;
  task_id?: number;
  subtask_id?: number;
  phase_id?: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: number;
  uploaded_at: string;
}

interface AttachmentManagerProps {
  entityId: number; // Can be projectId, taskId, subtaskId, or phaseId
  entityType: "project" | "task" | "subtask" | "phase";
}

export const AttachmentManager = ({
  entityId,
  entityType,
}: AttachmentManagerProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManager = user?.role === "Manager" || user?.role === "Admin";

  useEffect(() => {
    fetchAttachments();
  }, [entityId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      console.log(
        "Fetching attachments for entityId:",
        entityId,
        "entityType:",
        entityType,
      );
      const data = await attachmentAPI.getAttachments(entityId);
      console.log("Attachments API response:", data);

      // Handle different response formats
      if (Array.isArray(data)) {
        console.log("Response is array, setting attachments:", data);
        setAttachments(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        console.log(
          "Response has data property (array), setting attachments:",
          data.data,
        );
        setAttachments(data.data);
      } else if (data && data.success && Array.isArray(data.attachments)) {
        console.log(
          "Response has success and attachments, setting attachments:",
          data.attachments,
        );
        setAttachments(data.attachments);
      } else {
        console.log(
          "Unknown response format, setting empty array. Response:",
          data,
        );
        setAttachments([]);
      }
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      // Silently handle ENOENT errors (missing files on server)
      if (
        !error.message?.includes("ENOENT") &&
        !error.message?.includes("no such file")
      ) {
        toast.error(error.message || "Failed to fetch attachments");
      }
      // Set empty array on error so UI doesn't break
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", String(user?.id));

    // Set the appropriate entity ID
    if (entityType === "project") {
      formData.append("project_id", String(entityId));
    } else if (entityType === "task") {
      formData.append("task_id", String(entityId));
    } else if (entityType === "subtask") {
      formData.append("subtask_id", String(entityId));
    } else if (entityType === "phase") {
      formData.append("phase_id", String(entityId));
    }

    try {
      setUploading(true);
      await attachmentAPI.uploadAttachment(formData);
      toast.success("File uploaded successfully");
      fetchAttachments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error details:", error);
      const errorMessage =
        error.message ||
        error.error ||
        error.toString() ||
        "Failed to upload file";
      toast.error(
        errorMessage.trim() ||
        "Failed to upload file - please check backend logs",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm("Are you sure you want to delete this attachment?"))
      return;

    try {
      await attachmentAPI.deleteAttachment(attachmentId);
      toast.success("Attachment deleted successfully");
      fetchAttachments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete attachment");
    }
  };

  // const handleDownloadAttachment = (fileUrl: string, fileName: string) => {
  //   // Open the file URL in a new tab to download
  //   const link = document.createElement('a');
  //   link.href = fileUrl;
  //   link.download = fileName;
  //   link.target = '_blank';
  //   link.rel = 'noopener noreferrer';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleDownloadAttachment = async (
    attachmentId: number,
    fileName: string,
  ) => {
    try {
      const response = await attachmentAPI.downloadAttachment(attachmentId);
      console.log("DOWNLOAD RESPONSE:", response);

      const signedUrl = response.signed_url;

      // Open the signed URL
      const link = document.createElement("a");
      link.href = signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    return "📁";
  };

  if (loading) {
    return <div className="text-center py-4">Loading attachments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className={`text-lg font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
          <Paperclip className="h-5 w-5" />
          Attachments
        </h3>
        {isManager && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gradient-to-r from-[#0f5841] to-[#194f87] hover:opacity-90"
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <Card
          className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
        >
          <CardContent className="text-center py-8">
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              No attachments yet. {isManager && "Upload a file to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {attachments.map((attachment) => (
            <Card
              key={attachment.id}
              className={
                theme === "dark" ? "bg-slate-800 border-slate-700" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {getFileIcon(attachment.file_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {attachment.file_name}
                      </p>
                      <p
                        className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {formatFileSize(attachment.file_size)} •{" "}
                        {attachment.uploaded_at &&
                          !isNaN(new Date(attachment.uploaded_at).getTime())
                          ? new Date(attachment.uploaded_at).toLocaleDateString()
                          : "Unknown date"}
                      </p>
                    </div>
                  </div>
                  {isManager && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    // onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                    onClick={() =>
                      handleDownloadAttachment(
                        attachment.id,
                        attachment.file_name,
                      )
                    }
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
