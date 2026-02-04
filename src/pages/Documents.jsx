import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import DocumentVersionHistory from "@/components/documents/DocumentVersionHistory";
import { FileText, Search, Upload, Download, History, Clock, User, Tag, Eye, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Documents() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const { data: documents = [] } = useQuery({
    queryKey: ["companyDocuments"],
    queryFn: () => base44.entities.CompanyDocument.list("-updated_date"),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId) => {
      // Delete all versions first
      const versions = await base44.entities.DocumentVersion.filter({ document_id: docId });
      for (const version of versions) {
        await base44.entities.DocumentVersion.delete(version.id);
      }
      // Delete document
      await base44.entities.CompanyDocument.delete(docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["documentVersions"] });
    }
  });

  const filteredDocuments = documents.filter(doc => {
    // Access control - only show public docs or docs for user's department (or all departments)
    if (!doc.is_public && currentEmployee) {
      if (doc.department !== "all" && doc.department !== currentEmployee.department) {
        return false;
      }
    }

    // Search filter - search in title, description, tags, and OCR text
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = doc.title?.toLowerCase().includes(query);
      const matchesDescription = doc.description?.toLowerCase().includes(query);
      const matchesTags = doc.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesOCR = doc.ocr_text?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesTags && !matchesOCR) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== "all" && doc.category !== categoryFilter) {
      return false;
    }

    // Department filter
    if (departmentFilter !== "all" && doc.department !== departmentFilter) {
      return false;
    }

    return true;
  });

  const isAdmin = user?.role === "admin";

  const categoryIcons = {
    policy: "📋",
    procedure: "📝",
    template: "📄",
    form: "📑",
    handbook: "📘",
    compliance: "⚖️",
    training: "🎓",
    other: "📁"
  };

  return (
    <div>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage for company policies, templates, and documents"
      >
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedDocument(null);
              setIsUploadOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Documents</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{documents.length}</p>
              </div>
              <FileText className="w-10 h-10 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Templates</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {documents.filter(d => d.is_template).length}
                </p>
              </div>
              <Tag className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Public Documents</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {documents.filter(d => d.is_public).length}
                </p>
              </div>
              <Eye className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Restricted</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {documents.filter(d => !d.is_public).length}
                </p>
              </div>
              <Lock className="w-10 h-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search documents by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
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
        </CardHeader>

        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{categoryIcons[doc.category] || "📁"}</div>
                      <div className="flex gap-1">
                        {doc.is_template && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Template</Badge>
                        )}
                        {!doc.is_public && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Restricted
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-2">{doc.title}</h3>
                    
                    {doc.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{doc.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{doc.uploaded_by_name}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{format(parseISO(doc.updated_date), "MMM d, yyyy")}</span>
                    </div>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <Badge className="bg-slate-100 text-slate-700 capitalize">
                        v{doc.current_version || 1}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setIsVersionHistoryOpen(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsUploadOpen(true);
                            }}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No documents found</p>
              <p className="text-sm">
                {searchQuery || categoryFilter !== "all" || departmentFilter !== "all"
                  ? "Try adjusting your filters"
                  : isAdmin
                  ? "Upload your first document to get started"
                  : "No documents available yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {user && (
        <DocumentUploadDialog
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setSelectedDocument(null);
          }}
          currentUser={user}
          existingDocument={selectedDocument}
        />
      )}

      {selectedDocument && (
        <DocumentVersionHistory
          document={selectedDocument}
          isOpen={isVersionHistoryOpen}
          onClose={() => {
            setIsVersionHistoryOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
}