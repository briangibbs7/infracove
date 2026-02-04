import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, User, Calendar } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function OnboardingTaskManager({ employee, tasks }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.OnboardingTask.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
    },
  });

  const handleToggleTask = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      data: {
        status: newStatus,
        completed_date: newStatus === "completed" ? new Date().toISOString().split('T')[0] : null
      }
    });
  };

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {});

  const getStatusIcon = (task) => {
    if (task.status === "completed") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (task.status === "in_progress") return <Clock className="w-4 h-4 text-blue-600" />;
    if (task.due_date && isPast(parseISO(task.due_date))) return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700"
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Overall Completion</span>
              <span className="font-semibold">{completedTasks} of {tasks.length} tasks</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-slate-500 text-right">{Math.round(progressPercentage)}%</p>
          </div>
        </CardContent>
      </Card>

      {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
        <Card key={category} className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    task.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : task.due_date && isPast(parseISO(task.due_date))
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleToggleTask(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.status === "completed" ? "line-through text-slate-500" : ""}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(task)}
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-600 mt-2">
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assigned_to_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {format(parseISO(task.due_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        {task.completed_date && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Completed: {format(parseISO(task.completed_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic">{task.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}