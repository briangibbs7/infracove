import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { History, Download, RotateCcw, FileText, CheckCircle } from "lucide-react";

export default function DocumentVersionHistory({ document, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ["documentVersions", document?.id],
    queryFn: () => base44.entities.DocumentVersion.filter({
      document_id: document.id
    }),
    enabled: !!document?.id && isOpen,
  });

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      const version = versions.find(v => v.id === versionId);
      
      // Mark all versions as not current
      for (const v of versions) {
        if (v.is_current) {
          await base44.entities.DocumentVersion.update(v.id, {
            is_current: false,
            status: "superseded"
          });
        }
      }

      // Mark selected version as current
      await base44.entities.DocumentVersion.update(versionId, {
        is_current: true,
        status: "active"
      });

      // Update document to point to this version
      await base44.entities.CompanyDocument.update(document.id, {
        file_url: version.file_url,
        current_version: version.version_number,
        ocr_text: version.ocr_text
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["documentVersions"] });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History - {document?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {sortedVersions.map((version) => (
            <div
              key={version.id}
              className={`p-4 rounded-lg border-2 ${
                version.is_current
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        Version {version.version_number}
                      </h4>
                      {version.is_current && (
                        <Badge className="bg-indigo-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Current
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {version.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {version.uploaded_by_name} • {format(parseISO(version.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(version.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  {!version.is_current && (
                    <Button
                      size="sm"
                      onClick={() => restoreVersionMutation.mutate(version.id)}
                      disabled={restoreVersionMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>

              {version.change_summary && (
                <div className="bg-white rounded p-3 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Changes</p>
                  <p className="text-sm text-slate-700">{version.change_summary}</p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Size: {(version.file_size / 1024).toFixed(1)} KB</span>
                <span>Type: {version.file_type}</span>
                {version.ocr_text && (
                  <span className="text-green-600">✓ Searchable</span>
                )}
              </div>
            </div>
          ))}

          {sortedVersions.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No version history available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}