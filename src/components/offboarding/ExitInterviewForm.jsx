import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

export default function ExitInterviewForm({ employee, onSubmit, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      employee_id: employee.id,
      employee_name: employee.full_name,
      interview_date: new Date().toISOString().split('T')[0],
      reason_for_leaving: formData.get("reason_for_leaving"),
      overall_satisfaction: parseInt(formData.get("overall_satisfaction")),
      work_environment_rating: parseInt(formData.get("work_environment_rating")),
      management_rating: parseInt(formData.get("management_rating")),
      career_growth_rating: parseInt(formData.get("career_growth_rating")),
      work_life_balance_rating: parseInt(formData.get("work_life_balance_rating")),
      what_went_well: formData.get("what_went_well"),
      areas_for_improvement: formData.get("areas_for_improvement"),
      would_recommend_company: formData.get("would_recommend_company") === "true",
      open_to_return: formData.get("open_to_return") === "true",
      additional_comments: formData.get("additional_comments"),
      confidential_notes: formData.get("confidential_notes"),
      status: "completed",
    };

    onSubmit(data);
  };

  const RatingField = ({ name, label }) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} *</Label>
      <Select name={name} required>
        <SelectTrigger>
          <SelectValue placeholder="Rate 1-5" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
          <SelectItem value="2">2 - Dissatisfied</SelectItem>
          <SelectItem value="3">3 - Neutral</SelectItem>
          <SelectItem value="4">4 - Satisfied</SelectItem>
          <SelectItem value="5">5 - Very Satisfied</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
        <p className="text-sm text-slate-600">{employee.job_title} • {employee.department}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason_for_leaving">Reason for Leaving *</Label>
        <Select name="reason_for_leaving" required>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resignation">Resignation</SelectItem>
            <SelectItem value="retirement">Retirement</SelectItem>
            <SelectItem value="termination">Termination</SelectItem>
            <SelectItem value="relocation">Relocation</SelectItem>
            <SelectItem value="career_change">Career Change</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Satisfaction Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RatingField name="overall_satisfaction" label="Overall Job Satisfaction" />
          <RatingField name="work_environment_rating" label="Work Environment" />
          <RatingField name="management_rating" label="Management & Leadership" />
          <RatingField name="career_growth_rating" label="Career Growth Opportunities" />
          <RatingField name="work_life_balance_rating" label="Work-Life Balance" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="what_went_well">What Went Well? *</Label>
        <Textarea
          id="what_went_well"
          name="what_went_well"
          placeholder="What aspects of your employment did you enjoy most?"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
        <Textarea
          id="areas_for_improvement"
          name="areas_for_improvement"
          placeholder="What could the company improve?"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="would_recommend_company">Would Recommend Company?</Label>
          <Select name="would_recommend_company">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="open_to_return">Open to Return in Future?</Label>
          <Select name="open_to_return">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_comments">Additional Comments</Label>
        <Textarea
          id="additional_comments"
          name="additional_comments"
          placeholder="Any other feedback or comments..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confidential_notes">Confidential HR Notes</Label>
        <Textarea
          id="confidential_notes"
          name="confidential_notes"
          placeholder="Internal notes for HR use only..."
          rows={2}
          className="border-amber-200 bg-amber-50/50"
        />
        <p className="text-xs text-amber-700">This field is only visible to HR and will not be shared with the employee</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
          Submit Exit Interview
        </Button>
      </div>
    </form>
  );
}