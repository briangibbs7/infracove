import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function SendEmailDialog({ isOpen, onClose, candidate }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => base44.entities.EmailTemplate.filter({ is_active: true }),
    enabled: isOpen
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendCandidateEmail', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidateEmails"] });
      onClose();
    },
  });

  if (!candidate) return null;

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const getPreviewText = (text) => {
    if (!text) return "";
    return text
      .replace(/\{\{first_name\}\}/g, candidate.first_name || '')
      .replace(/\{\{last_name\}\}/g, candidate.last_name || '')
      .replace(/\{\{full_name\}\}/g, `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim())
      .replace(/\{\{job_title\}\}/g, candidate.job_title || '')
      .replace(/\{\{email\}\}/g, candidate.email || '');
  };

  const handleSend = () => {
    if (selectedTemplateId) {
      sendEmailMutation.mutate({
        candidate_id: candidate.id,
        template_id: selectedTemplateId
      });
    } else {
      sendEmailMutation.mutate({
        candidate_id: candidate.id,
        custom_subject: customSubject,
        custom_body: customBody
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {candidate.first_name} {candidate.last_name}</DialogTitle>
          <p className="text-sm text-slate-600">{candidate.email}</p>
        </DialogHeader>

        <Tabs defaultValue="template" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="template" className="flex-1">Use Template</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Email</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <div>
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm">
                    {previewMode ? getPreviewText(selectedTemplate.subject) : selectedTemplate.subject}
                  </div>
                </div>

                <div>
                  <Label>Body</Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {previewMode ? getPreviewText(selectedTemplate.body) : selectedTemplate.body}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Show Template" : "Preview"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={12}
                placeholder="Email body..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendEmailMutation.isPending || (!selectedTemplateId && (!customSubject || !customBody))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}