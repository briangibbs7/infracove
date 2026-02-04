import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrainingRequestForm({ currentEmployee, onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      employee_id: currentEmployee?.id,
      employee_name: currentEmployee?.full_name,
      topic: formData.get("topic"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      requested_date: new Date().toISOString().split('T')[0],
      status: "pending",
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-900">
          Request new training topics or courses that you'd like to see added to the platform.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Training Topic / Course Title *</Label>
        <Input
          id="topic"
          name="topic"
          placeholder="e.g., Advanced Excel for Data Analysis"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Why do you need this training? *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Explain how this training would benefit you and the team..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select name="category" required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="soft_skills">Soft Skills</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="medium">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
          Submit Request
        </Button>
      </div>
    </form>
  );
}