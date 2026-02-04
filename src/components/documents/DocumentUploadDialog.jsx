import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2, FileText } from "lucide-react";

export default function DocumentUploadDialog({ isOpen, onClose, currentUser, existingDocument = null }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData) => {
      setUploadProgress("Uploading file...");
      
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: formData.file
      });

      let documentId = existingDocument?.id;
      let versionNumber = 1;

      if (existingDocument) {
        // Get existing versions to determine next version number
        const versions = await base44.entities.DocumentVersion.filter({
          document_id: existingDocument.id
        });
        versionNumber = versions.length + 1;

        // Mark all previous versions as not current
        for (const version of versions) {
          if (version.is_current) {
            await base44.entities.DocumentVersion.update(version.id, {
              is_current: false,
              status: "superseded"
            });
          }
        }
      } else {
        setUploadProgress("Creating document...");
        
        // Create new document
        const newDoc = await base44.entities.CompanyDocument.create({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          department: formData.department,
          tags: formData.tags,
          is_template: formData.is_template,
          is_public: formData.is_public,
          uploaded_by: currentUser.id,
          uploaded_by_name: currentUser.full_name,
          current_version: 1,
          file_url: file_url,
        });
        documentId = newDoc.id;
      }

      setUploadProgress("Processing OCR...");

      // Process OCR
      let ocrText = "";
      try {
        const ocrResult = await base44.functions.invoke('processDocumentOCR', {
          file_url: file_url,
          document_id: documentId,
          document_title: formData.title
        });
        ocrText = ocrResult.data?.extracted_text || "";
      } catch (error) {
        console.error('OCR failed:', error);
        // Continue without OCR if it fails
      }

      setUploadProgress("Creating version record...");

      // Create version record
      await base44.entities.DocumentVersion.create({
        document_id: documentId,
        document_title: formData.title,
        version_number: versionNumber,
        file_url: file_url,
        file_size: formData.file.size,
        file_type: formData.file.type,
        ocr_text: ocrText,
        change_summary: formData.change_summary || (versionNumber === 1 ? "Initial version" : "Updated"),
        uploaded_by: currentUser.id,
        uploaded_by_name: currentUser.full_name,
        is_current: true,
        status: "active"
      });

      // Update document with OCR text and current version
      await base44.entities.CompanyDocument.update(documentId, {
        ocr_text: ocrText,
        current_version: versionNumber,
        file_url: file_url,
      });

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["documentVersions"] });
      setUploadProgress("");
      onClose();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadProgress("");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !existingDocument) return;

    setIsUploading(true);
    const formData = new FormData(e.target);
    
    const data = {
      file: selectedFile,
      title: existingDocument?.title || formData.get("title"),
      description: existingDocument?.description || formData.get("description"),
      category: existingDocument?.category || formData.get("category"),
      department: existingDocument?.department || formData.get("department"),
      tags: existingDocument?.tags || formData.get("tags")?.split(",").map(t => t.trim()).filter(Boolean) || [],
      is_template: existingDocument?.is_template ?? (formData.get("is_template") === "on"),
      is_public: existingDocument?.is_public ?? (formData.get("is_public") === "on"),
      change_summary: formData.get("change_summary"),
    };

    await uploadDocumentMutation.mutateAsync(data);
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingDocument ? `Upload New Version - ${existingDocument.title}` : "Upload Document"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!existingDocument && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input id="title" name="title" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="handbook">Handbook</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="training">Training Material</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select name="department">
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="e.g., onboarding, compliance, remote-work" />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox name="is_template" />
                  <span className="text-sm">This is a template</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox name="is_public" defaultChecked />
                  <span className="text-sm">Visible to all employees</span>
                </label>
              </div>
            </>
          )}

          {existingDocument && (
            <div className="space-y-2">
              <Label htmlFor="change_summary">Change Summary *</Label>
              <Textarea
                id="change_summary"
                name="change_summary"
                placeholder="Describe what changed in this version..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">
              {existingDocument ? "New Version File *" : "File *"}
            </Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                required
              />
              <label htmlFor="file" className="cursor-pointer">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  {selectedFile ? selectedFile.name : "Click to select file"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                </p>
              </label>
            </div>
          </div>

          {uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || (!selectedFile && !existingDocument)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}