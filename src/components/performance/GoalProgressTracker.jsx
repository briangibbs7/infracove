import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function GoalProgressTracker({ goal, onUpdate }) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const handleAddUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProgress = parseInt(formData.get("progress"));
    const note = formData.get("note");

    const updates = goal.updates || [];
    updates.push({
      date: new Date().toISOString().split('T')[0],
      note: note,
      progress_change: newProgress - (goal.progress || 0)
    });

    onUpdate(goal.id, {
      progress: newProgress,
      updates: updates,
      status: newProgress >= 100 ? "completed" : newProgress > 0 ? "in_progress" : goal.status
    });

    setShowUpdateForm(false);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("milestone_title");

    const milestones = goal.milestones || [];
    milestones.push({
      title: title,
      completed: false
    });

    onUpdate(goal.id, { milestones });
    setShowMilestoneForm(false);
  };

  const handleToggleMilestone = (index) => {
    const milestones = [...(goal.milestones || [])];
    milestones[index] = {
      ...milestones[index],
      completed: !milestones[index].completed,
      completed_date: !milestones[index].completed ? new Date().toISOString().split('T')[0] : null
    };
    onUpdate(goal.id, { milestones });
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-lg font-bold text-indigo-600">{goal.progress || 0}%</span>
        </div>
        <Progress value={goal.progress || 0} className="h-3" />
      </div>

      {/* Milestones */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Milestones</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {showMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="flex gap-2 mb-2">
              <Input
                name="milestone_title"
                placeholder="Milestone title..."
                required
                className="flex-1"
              />
              <Button type="submit" size="sm">Add</Button>
            </form>
          )}

          {goal.milestones && goal.milestones.length > 0 ? (
            goal.milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                onClick={() => handleToggleMilestone(idx)}
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${milestone.completed ? "line-through text-slate-500" : "text-slate-900"}`}>
                    {milestone.title}
                  </p>
                  {milestone.completed && milestone.completed_date && (
                    <p className="text-xs text-slate-500">
                      Completed {format(parseISO(milestone.completed_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No milestones yet</p>
          )}
        </CardContent>
      </Card>

      {/* Updates */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Progress Updates</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpdateForm(!showUpdateForm)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Update
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showUpdateForm && (
            <form onSubmit={handleAddUpdate} className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Progress %</label>
                <Input
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={goal.progress || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Note</label>
                <Textarea
                  name="note"
                  placeholder="What progress was made?"
                  rows={2}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">Save Update</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowUpdateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {goal.updates && goal.updates.length > 0 ? (
            goal.updates.slice().reverse().map((update, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">{format(parseISO(update.date), "MMM d, yyyy")}</span>
                  {update.progress_change !== 0 && (
                    <Badge className={update.progress_change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {update.progress_change > 0 ? "+" : ""}{update.progress_change}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700">{update.note}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No updates yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}