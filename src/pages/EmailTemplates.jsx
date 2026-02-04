import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import EmailTemplateDialog from "@/components/hiring/EmailTemplateDialog";
import { Plus, Edit, Trash2, Mail } from "lucide-react";

export default function EmailTemplates() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
  });

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowDialog(true);
  };

  const handleDelete = async (template) => {
    if (confirm(`Delete template "${template.name}"?`)) {
      await deleteMutation.mutateAsync(template.id);
    }
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div>
      <PageHeader
        title="Email Templates"
        subtitle="Manage templated communications for candidates"
      >
        <Button 
          onClick={() => { setSelectedTemplate(null); setShowDialog(true); }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    {template.name}
                  </CardTitle>
                  <Badge className="mt-2 bg-slate-100 text-slate-700">
                    {getCategoryLabel(template.category)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-1">Subject:</p>
                <p className="text-sm text-slate-900 line-clamp-2">{template.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Preview:</p>
                <p className="text-sm text-slate-700 line-clamp-3">{template.body}</p>
              </div>
              {template.created_by_name && (
                <p className="text-xs text-slate-500">By {template.created_by_name}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleEdit(template)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(template)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-full border-0 shadow-sm">
            <CardContent className="p-12 text-center text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No email templates yet</p>
              <p className="text-sm mt-1">Create your first template to streamline candidate communication</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EmailTemplateDialog
        isOpen={showDialog}
        onClose={() => { setShowDialog(false); setSelectedTemplate(null); }}
        template={selectedTemplate}
      />
    </div>
  );
}