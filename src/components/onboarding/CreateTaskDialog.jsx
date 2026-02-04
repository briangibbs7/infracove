import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

const TASK_CATEGORIES = [
  "IT Setup",
  "HR Documentation",
  "Training",
  "Team Introduction",
  "Workspace Setup",
  "Compliance",
  "Other"
];

export default function CreateTaskDialog({ isOpen, onClose, employee, task }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "IT Setup",
    priority: "medium",
    assigned_to: "",
    due_date: null,
    notes: "",
    send_notification: true
  });
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        category: task.category,
        priority: task.priority,
        assigned_to: task.assigned_to || "",
        due_date: task.due_date ? new Date(task.due_date) : null,
        notes: task.notes || "",
        send_notification: true
      });
    } else {
      setFormData({
        title: "",
        description: "",
        category: "IT Setup",
        priority: "medium",
        assigned_to: "",
        due_date: null,
        notes: "",
        send_notification: true
      });
    }
  }, [task, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const assignedEmployee = employees.find(e => e.id === data.assigned_to);
      
      const taskData = {
        ...data,
        employee_id: employee.id,
        employee_name: employee.full_name,
        assigned_to_name: assignedEmployee?.full_name || "",
        status: "pending",
        created_by: user.id,
        created_by_name: user.full_name,
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null
      };

      const newTask = await base44.entities.OnboardingTask.create(taskData);

      if (data.send_notification && assignedEmployee) {
        await base44.functions.invoke('notifyTaskAssignment', {
          task_id: newTask.id,
          employee_email: assignedEmployee.email,
          task_title: data.title
        });
      }

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const assignedEmployee = employees.find(e => e.id === data.assigned_to);
      return base44.entities.OnboardingTask.update(task.id, {
        ...data,
        assigned_to_name: assignedEmployee?.full_name || "",
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit" : "Create"} Onboarding Task</DialogTitle>
          <p className="text-sm text-slate-600">{employee?.full_name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Task Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Set up laptop"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Task details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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

          <div>
            <Label>Assign To</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={employee.id}>{employee.full_name} (New Hire)</SelectItem>
                {employees.filter(e => e.id !== employee.id && e.status === "active").map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData({ ...formData, due_date: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {!task && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send_notification"
                checked={formData.send_notification}
                onChange={(e) => setFormData({ ...formData, send_notification: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="send_notification" className="cursor-pointer">
                Send email notification to assignee
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                task ? "Update Task" : "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}