import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateAuditDialog({ open, onOpenChange, programs, onSubmit }) {
  const [formData, setFormData] = useState({
    audit_name: "",
    audit_type: "internal",
    program_id: "",
    auditor_name: "",
    auditor_organization: "",
    start_date: "",
    end_date: "",
    scope: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedProgram = programs.find(p => p.id === formData.program_id);
    onSubmit({
      ...formData,
      program_name: selectedProgram?.program_name || "",
      status: "scheduled",
    });
    setFormData({
      audit_name: "",
      audit_type: "internal",
      program_id: "",
      auditor_name: "",
      auditor_organization: "",
      start_date: "",
      end_date: "",
      scope: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Compliance Audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Audit Name</Label>
            <Input
              value={formData.audit_name}
              onChange={(e) => setFormData({ ...formData, audit_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Audit Type</Label>
              <Select value={formData.audit_type} onValueChange={(value) => setFormData({ ...formData, audit_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Compliance Program</Label>
              <Select value={formData.program_id} onValueChange={(value) => setFormData({ ...formData, program_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Auditor Name</Label>
              <Input
                value={formData.auditor_name}
                onChange={(e) => setFormData({ ...formData, auditor_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Auditor Organization</Label>
              <Input
                value={formData.auditor_organization}
                onChange={(e) => setFormData({ ...formData, auditor_organization: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Audit Scope</Label>
            <Textarea
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              rows={4}
              placeholder="Describe the areas and processes covered by this audit..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Audit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}