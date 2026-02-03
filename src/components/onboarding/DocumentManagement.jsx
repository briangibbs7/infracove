import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { FileText, Upload, CheckCircle, AlertCircle, Download, Clock } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const DOCUMENT_ICONS = {
  employment_contract: FileText,
  w4_tax_form: FileText,
  i9_form: FileText,
  direct_deposit: FileText,
  benefits_enrollment: FileText,
  nda: FileText,
  policy_acknowledgment: FileText,
  emergency_contact_form: FileText,
  other: FileText
};

export default function DocumentManagement({ employeeId, isManager = false }) {
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ["onboardingDocuments", employeeId],
    queryFn: () => base44.entities.OnboardingDocument.filter({ employee_id: employeeId }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingDocuments", employeeId] });
    },
  });

  const handleFileUpload = async (document, file) => {
    setUploadingDoc(document.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync({
        id: document.id,
        data: {
          file_url,
          status: "submitted",
          submitted_date: new Date().toISOString().split("T")[0]
        }
      });
    } catch (error) {
      alert("Failed to upload document");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleReview = async (document, status, notes = "") => {
    const user = await base44.auth.me();
    await updateMutation.mutateAsync({
      id: document.id,
      data: {
        status,
        reviewed_by: user.id,
        reviewed_by_name: user.full_name,
        reviewed_date: new Date().toISOString().split("T")[0],
        revision_notes: notes || undefined
      }
    });

    // Notify employee
    await base44.entities.Notification.create({
      type: status === "approved" ? "document_approved" : "document_revision_required",
      title: status === "approved" ? "Document Approved" : "Document Revision Required",
      message: status === "approved" 
        ? `Your ${document.title} has been approved`
        : `Your ${document.title} requires revision: ${notes}`,
      recipient_id: document.employee_id,
      priority: status === "approved" ? "low" : "medium",
      link: "/Onboarding"
    });
  };

  const requiredDocs = documents.filter(d => d.is_required);
  const completedRequired = requiredDocs.filter(d => d.status === "approved").length;
  const progressPercentage = requiredDocs.length > 0 
    ? Math.round((completedRequired / requiredDocs.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Document Completion</span>
            <span className="text-sm font-semibold text-indigo-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completedRequired} of {requiredDocs.length} required documents completed
          </p>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-8 text-center">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No documents required yet</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => {
            const Icon = DOCUMENT_ICONS[doc.document_type] || FileText;
            const isOverdue = doc.status !== "approved" && doc.due_date && isPast(parseISO(doc.due_date));

            return (
              <Card key={doc.id} className={`border-slate-200 ${isOverdue ? "border-red-200 bg-red-50" : ""}`}>
                <CardContent className="p-4 md:p-4">
                  <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${isOverdue ? "text-red-600" : "text-slate-400"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{doc.title}</h4>
                          {doc.is_required && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Required
                            </Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <StatusBadge status={doc.status} />
                          {doc.due_date && (
                            <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                              Due: {format(parseISO(doc.due_date), "MMM d, yyyy")}
                            </span>
                          )}
                          {doc.submitted_date && (
                            <span className="text-xs text-slate-500">
                              Submitted: {format(parseISO(doc.submitted_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        {doc.revision_notes && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                            <p className="text-xs text-amber-800">{doc.revision_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-9">
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </a>
                      )}
                      
                      {!isManager && doc.status !== "approved" && (
                        <label>
                          <Button size="sm" variant="outline" disabled={uploadingDoc === doc.id} asChild className="h-9">
                            <span>
                              <Upload className="w-4 h-4 mr-1" />
                              {uploadingDoc === doc.id ? "Uploading..." : doc.file_url ? "Replace" : "Upload"}
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleFileUpload(doc, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}

                      {isManager && doc.status === "submitted" && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleReview(doc, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none h-9"
                          >
                            <CheckCircle className="w-4 h-4 md:mr-1" />
                            <span className="hidden md:inline">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const notes = prompt("Revision notes:");
                              if (notes) handleReview(doc, "requires_revision", notes);
                            }}
                            className="text-amber-600 hover:bg-amber-50 flex-1 md:flex-none h-9"
                          >
                            <span className="text-xs md:text-sm">Request Changes</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}