import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PLACEHOLDERS = [
  { key: "{{first_name}}", label: "First Name" },
  { key: "{{last_name}}", label: "Last Name" },
  { key: "{{full_name}}", label: "Full Name" },
  { key: "{{job_title}}", label: "Job Title" },
  { key: "{{email}}", label: "Email" },
];

export default function EmailTemplateDialog({ isOpen, onClose, template }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    subject: "",
    body: "",
    is_active: true
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: "",
        category: "other",
        subject: "",
        body: "",
        is_active: true
      });
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.EmailTemplate.create({
        ...data,
        created_by_name: user.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.update(template.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (template) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertPlaceholder = (placeholder) => {
    const textarea = document.getElementById("template-body");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    setFormData({ ...formData, body: newText });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} Email Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Template Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Interview Invitation"
              required
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="application_received">Application Received</SelectItem>
                <SelectItem value="screening_invitation">Screening Invitation</SelectItem>
                <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                <SelectItem value="phone_screen_scheduled">Phone Screen Scheduled</SelectItem>
                <SelectItem value="technical_assessment">Technical Assessment</SelectItem>
                <SelectItem value="offer_letter">Offer Letter</SelectItem>
                <SelectItem value="rejection">Rejection</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Subject Line *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Interview Invitation for {{job_title}}"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Email Body *</Label>
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDERS.map(p => (
                  <Badge
                    key={p.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => insertPlaceholder(p.key)}
                  >
                    {p.label}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea
              id="template-body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              placeholder="Dear {{first_name}},&#10;&#10;We would like to invite you for an interview..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">Click badges to insert placeholders</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              {template ? "Update" : "Create"} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}