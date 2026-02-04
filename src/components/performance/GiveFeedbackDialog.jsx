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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ThumbsUp, MessageSquare, X } from "lucide-react";

export default function GiveFeedbackDialog({ open, onClose, recipientId, recipientName, currentUser }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: "positive",
    feedback_text: "",
    related_goal_id: "",
    related_skill_id: "",
    visibility: "manager",
    is_anonymous: false,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", recipientId],
    queryFn: () => base44.entities.PerformanceGoal.filter({ employee_id: recipientId }),
    enabled: !!recipientId,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["employee-skills", recipientId],
    queryFn: () => base44.entities.EmployeeSkill.filter({ employee_id: recipientId }),
    enabled: !!recipientId,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.ContinuousFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["continuous-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-stats"] });
      onClose();
      setFormData({
        type: "positive",
        feedback_text: "",
        related_goal_id: "",
        related_skill_id: "",
        visibility: "manager",
        is_anonymous: false,
        tags: [],
      });
    },
  });

  const handleSubmit = () => {
    const selectedGoal = goals.find(g => g.id === formData.related_goal_id);
    const selectedSkill = skills.find(s => s.id === formData.related_skill_id);

    createFeedbackMutation.mutate({
      recipient_id: recipientId,
      recipient_name: recipientName,
      giver_id: currentUser.id,
      giver_name: formData.is_anonymous ? "Anonymous" : currentUser.full_name,
      type: formData.type,
      feedback_text: formData.feedback_text,
      related_goal_id: formData.related_goal_id || null,
      related_goal_title: selectedGoal?.title || null,
      related_skill_id: formData.related_skill_id || null,
      related_skill_name: selectedSkill?.skill_name || null,
      visibility: formData.visibility,
      is_anonymous: formData.is_anonymous,
      tags: formData.tags,
      status: "provided",
      provided_date: new Date().toISOString().split('T')[0],
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Give Feedback to {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Feedback Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    Positive Feedback
                  </div>
                </SelectItem>
                <SelectItem value="constructive">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    Constructive Feedback
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Feedback</Label>
            <Textarea
              value={formData.feedback_text}
              onChange={(e) => setFormData({ ...formData, feedback_text: e.target.value })}
              placeholder="Share your feedback..."
              className="h-32"
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

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData({ ...formData, visibility: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (only recipient)</SelectItem>
                <SelectItem value="manager">Manager & recipient</SelectItem>
                <SelectItem value="public">Public (team visible)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
            />
            <Label htmlFor="anonymous" className="cursor-pointer">
              Give feedback anonymously
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.feedback_text.trim() || createFeedbackMutation.isPending}
          >
            {createFeedbackMutation.isPending ? "Sending..." : "Send Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}