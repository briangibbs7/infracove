import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Send } from "lucide-react";

const RECOGNITION_TYPES = {
  kudos: { label: "Kudos", points: 10, icon: "👏" },
  achievement: { label: "Achievement", points: 25, icon: "🏆" },
  skill_milestone: { label: "Skill Milestone", points: 50, icon: "🎯" },
  training_completion: { label: "Training Completion", points: 30, icon: "📚" },
  project_success: { label: "Project Success", points: 40, icon: "🚀" },
  peer_recognition: { label: "Peer Recognition", points: 15, icon: "🤝" },
  leadership: { label: "Leadership", points: 35, icon: "⭐" }
};

export default function GiveRecognitionDialog({ isOpen, onClose, recipient, currentUser }) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("kudos");
  const [customPoints, setCustomPoints] = useState(false);

  const { data: skills = [] } = useQuery({
    queryKey: ["companySkills"],
    queryFn: () => base44.entities.CompanySkill.filter({ status: "active" }),
  });

  const { data: trainingCourses = [] } = useQuery({
    queryKey: ["trainingCourses"],
    queryFn: () => base44.entities.TrainingCourse.filter({ status: "active" }),
  });

  const createRecognitionMutation = useMutation({
    mutationFn: async (data) => {
      // Create recognition
      const recognition = await base44.entities.Recognition.create(data);

      // Update or create employee points
      const existingPoints = await base44.entities.EmployeePoints.filter({ 
        employee_id: recipient.id 
      });

      if (existingPoints.length > 0) {
        await base44.entities.EmployeePoints.update(existingPoints[0].id, {
          total_points: (existingPoints[0].total_points || 0) + data.points_awarded,
          points_this_month: (existingPoints[0].points_this_month || 0) + data.points_awarded,
          points_this_quarter: (existingPoints[0].points_this_quarter || 0) + data.points_awarded,
          recognition_count: (existingPoints[0].recognition_count || 0) + 1,
        });
      } else {
        await base44.entities.EmployeePoints.create({
          employee_id: recipient.id,
          employee_name: recipient.full_name,
          total_points: data.points_awarded,
          points_this_month: data.points_awarded,
          points_this_quarter: data.points_awarded,
          recognition_count: 1,
        });
      }

      // Create notification
      await base44.entities.Notification.create({
        recipient_id: recipient.id,
        recipient_name: recipient.full_name,
        type: "recognition_received",
        title: `🎉 Recognition from ${currentUser.full_name}`,
        message: `${data.title} - ${data.points_awarded} points awarded!`,
        link: "/Dashboard",
        priority: "normal",
      });

      return recognition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
      queryClient.invalidateQueries({ queryKey: ["employeePoints"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      giver_id: currentUser.id,
      giver_name: currentUser.full_name,
      type: selectedType,
      title: formData.get("title"),
      message: formData.get("message"),
      points_awarded: customPoints 
        ? parseInt(formData.get("custom_points")) 
        : RECOGNITION_TYPES[selectedType].points,
      related_skill_id: formData.get("related_skill_id") || undefined,
      related_skill_name: formData.get("related_skill_id") 
        ? skills.find(s => s.id === formData.get("related_skill_id"))?.name 
        : undefined,
      related_training_id: formData.get("related_training_id") || undefined,
      related_training_name: formData.get("related_training_id")
        ? trainingCourses.find(t => t.id === formData.get("related_training_id"))?.title
        : undefined,
      is_public: formData.get("is_public") === "on",
    };

    createRecognitionMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Give Recognition to {recipient?.full_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Recognition Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(RECOGNITION_TYPES).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedType === key
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{config.label}</p>
                      <p className="text-xs text-slate-500">{config.points} points</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Great teamwork on the project!"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Describe why you're giving this recognition..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="related_skill_id">Related Skill (Optional)</Label>
              <Select name="related_skill_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="related_training_id">Related Training (Optional)</Label>
              <Select name="related_training_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {trainingCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={customPoints}
                onCheckedChange={setCustomPoints}
              />
              <span className="text-sm">Custom points amount</span>
            </label>

            {customPoints && (
              <Input
                type="number"
                name="custom_points"
                min="1"
                max="100"
                defaultValue={RECOGNITION_TYPES[selectedType].points}
                className="w-32"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is_public" name="is_public" defaultChecked />
            <Label htmlFor="is_public" className="cursor-pointer">
              Make this recognition public
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={createRecognitionMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Recognition
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}