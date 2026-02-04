import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function RequestFeedbackDialog({ open, onClose, currentEmployee, currentUser }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    from_employee_id: "",
    feedback_text: "",
    related_goal_id: "",
    related_skill_id: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["my-goals"],
    queryFn: () => base44.entities.PerformanceGoal.filter({ employee_id: currentEmployee?.id }),
    enabled: !!currentEmployee,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["my-skills"],
    queryFn: () => base44.entities.EmployeeSkill.filter({ employee_id: currentEmployee?.id }),
    enabled: !!currentEmployee,
  });

  const requestFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.ContinuousFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["continuous-feedback"] });
      onClose();
      setFormData({
        from_employee_id: "",
        feedback_text: "",
        related_goal_id: "",
        related_skill_id: "",
      });
    },
  });

  const handleSubmit = () => {
    const selectedEmployee = employees.find(e => e.id === formData.from_employee_id);
    const selectedGoal = goals.find(g => g.id === formData.related_goal_id);
    const selectedSkill = skills.find(s => s.id === formData.related_skill_id);

    requestFeedbackMutation.mutate({
      recipient_id: currentEmployee.id,
      recipient_name: currentEmployee.full_name,
      giver_id: formData.from_employee_id,
      giver_name: selectedEmployee?.full_name || "",
      type: "request",
      feedback_text: formData.feedback_text,
      related_goal_id: formData.related_goal_id || null,
      related_goal_title: selectedGoal?.title || null,
      related_skill_id: formData.related_skill_id || null,
      related_skill_name: selectedSkill?.skill_name || null,
      visibility: "private",
      status: "pending",
      requested_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Request From</Label>
            <Select
              value={formData.from_employee_id}
              onValueChange={(value) => setFormData({ ...formData, from_employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(e => e.id !== currentEmployee?.id)
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.job_title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>What would you like feedback on?</Label>
            <Textarea
              value={formData.feedback_text}
              onChange={(e) => setFormData({ ...formData, feedback_text: e.target.value })}
              placeholder="E.g., My presentation skills, my work on the recent project, my collaboration..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Goal (Optional)</Label>
              <Select
                value={formData.related_goal_id}
                onValueChange={(value) => setFormData({ ...formData, related_goal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal..." />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Related Skill (Optional)</Label>
              <Select
                value={formData.related_skill_id}
                onValueChange={(value) => setFormData({ ...formData, related_skill_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill..." />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.skill_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.from_employee_id || requestFeedbackMutation.isPending}
          >
            {requestFeedbackMutation.isPending ? "Sending..." : "Request Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}