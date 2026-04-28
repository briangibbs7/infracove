import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUp, FileText, Lock, Download, Trash2, Plus, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "contract", label: "Employment Contract" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "performance_review", label: "Performance Review" },
  { value: "feedback", label: "Feedback PDF" },
  { value: "tax_form", label: "Tax Form (W-4, I-9, etc)" },
  { value: "handbook_ack", label: "Handbook Acknowledgement" },
  { value: "nda", label: "NDA" },
  { value: "other", label: "Other" },
];

export default function EmployeeDocuments({ employeeId, employeeName, isAdmin }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("contract");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ["employeeDocuments", employeeId],
    queryFn: () => 
      base44.entities.EmployeeDocument?.filter 
        ? base44.entities.EmployeeDocument.filter({ employee_id: employeeId }, "-created_date")
        : [],
    enabled: !!employeeId,
  });

  const createDocMutation = useMutation({
    mutationFn: async (docData) => {
      const result = await base44.entities.EmployeeDocument.create(docData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] });
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocType("contract");
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to upload document");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.EmployeeDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] });
      toast.success("Document deleted");
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const fileUrl = await uploadFileToStorage(selectedFile);
      
      await createDocMutation.mutateAsync({
        employee_id: employeeId,
        employee_name: employeeName,
        document_type: docType,
        file_name: selectedFile.name,
        file_url: fileUrl,
        file_size: selectedFile.size,
        uploaded_by: "admin",
        notes: notes || null,
        is_sensitive: true,
      });
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFileToStorage = async (file) => {
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    } catch (error) {
      throw new Error("Failed to upload file to storage");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Restricted Access</p>
          <p className="text-sm text-amber-700">Only administrators can view sensitive documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Secure Documents
          </h3>
          <p className="text-xs text-slate-500 mt-1">Contracts, reviews, tax forms & sensitive files</p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 truncate">{doc.file_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(doc.created_date), "MMM d, yyyy")}
                    </span>
                    {doc.notes && (
                      <span className="text-slate-600 truncate">{doc.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {doc.file_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.file_url, "_blank")}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocMutation.mutate(doc.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No documents uploaded yet</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Secure Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">File *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <FileUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-900">
                    {selectedFile ? selectedFile.name : "Click to upload or drag"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, XLS, XLSX • Max 10MB</p>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Signed by employee on 4/28/26"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">
                This document is stored securely and only accessible to administrators.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}