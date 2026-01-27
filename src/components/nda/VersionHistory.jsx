import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { Clock, Download, CheckCircle2, FileText, GitBranch } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function VersionHistory({ versions, onDownload }) {
  if (!versions || versions.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">No version history available</p>
        </CardContent>
      </Card>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-3">
      {sortedVersions.map((version, index) => (
        <Card 
          key={version.id} 
          className={`border ${version.is_current ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  version.is_current ? 'bg-indigo-100' : 'bg-slate-100'
                }`}>
                  <GitBranch className={`w-5 h-5 ${
                    version.is_current ? 'text-indigo-600' : 'text-slate-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">
                      Version {version.version_number}
                    </h4>
                    {version.is_current && (
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                        Current
                      </Badge>
                    )}
                    <StatusBadge status={version.status} />
                  </div>
                  
                  {version.change_summary && (
                    <p className="text-sm text-slate-600 mb-2">{version.change_summary}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(version.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    {version.created_by_name && (
                      <span>by {version.created_by_name}</span>
                    )}
                    {version.signed_date && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Signed {format(parseISO(version.signed_date), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  {version.signed_by && version.signed_by.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      Signed by: {version.signed_by.join(", ")}
                    </div>
                  )}
                </div>
              </div>

              {version.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(version)}
                  className="shrink-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}