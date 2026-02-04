import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ThreeSixtyFeedbackDialog({ review, currentEmployee, onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const feedbackData = {
      reviewer_id: currentEmployee?.id,
      reviewer_name: currentEmployee?.full_name,
      relationship: formData.get("relationship"),
      strengths: formData.get("strengths"),
      areas_for_improvement: formData.get("areas_for_improvement"),
      collaboration_rating: parseFloat(formData.get("collaboration_rating")),
      communication_rating: parseFloat(formData.get("communication_rating")),
      technical_skills_rating: parseFloat(formData.get("technical_skills_rating")),
      comments: formData.get("comments"),
      submitted_date: new Date().toISOString().split('T')[0],
    };

    onSubmit(feedbackData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg">
        <h3 className="font-semibold text-slate-900">{review.employee_name}</h3>
        <p className="text-sm text-slate-500">{review.review_period} • 360° Feedback</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">Your Relationship *</Label>
        <Select name="relationship" required>
          <SelectTrigger>
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="peer">Peer / Colleague</SelectItem>
            <SelectItem value="direct_report">Direct Report</SelectItem>
            <SelectItem value="cross_functional">Cross-Functional Partner</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="collaboration_rating">Collaboration (1-5) *</Label>
          <Select name="collaboration_rating" required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="communication_rating">Communication (1-5) *</Label>
          <Select name="communication_rating" required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technical_skills_rating">Technical Skills (1-5) *</Label>
          <Select name="technical_skills_rating" required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strengths">Key Strengths *</Label>
        <Textarea
          id="strengths"
          name="strengths"
          placeholder="What does this person do well?"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
        <Textarea
          id="areas_for_improvement"
          name="areas_for_improvement"
          placeholder="Where could this person improve?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Additional Comments</Label>
        <Textarea
          id="comments"
          name="comments"
          placeholder="Any other feedback..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
          Submit Feedback
        </Button>
      </div>
    </form>
  );
}