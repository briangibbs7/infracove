import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, FileText, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import StatusBadge from "@/components/ui/StatusBadge";

export default function NewHireChecklist({ tasks, documents, onTaskComplete }) {
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Welcome! 🎉</h3>
              <p className="text-slate-600 mt-1">Complete these tasks to get started</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-600">{progressPercentage}%</p>
              <p className="text-sm text-slate-500">{completedTasks} of {tasks.length}</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* My Tasks */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>My Onboarding Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No tasks assigned yet</p>
            ) : (
              tasks.map(task => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isCompleted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <StatusBadge status={task.status} />
                          {task.due_date && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due {format(parseISO(task.due_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => onTaskComplete(task)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {documents && documents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Important Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-900">{doc.name}</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}