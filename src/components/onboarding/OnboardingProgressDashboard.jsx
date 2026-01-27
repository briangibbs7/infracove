import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function OnboardingProgressDashboard({ employees, tasks }) {
  // Group tasks by employee
  const employeeProgress = employees
    .filter(emp => emp.status === "onboarding" || emp.status === "active")
    .map(emp => {
      const empTasks = tasks.filter(t => t.employee_id === emp.id);
      const completedTasks = empTasks.filter(t => t.status === "completed").length;
      const totalTasks = empTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const overdueTasks = empTasks.filter(t => 
        t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date()
      ).length;
      
      return {
        ...emp,
        totalTasks,
        completedTasks,
        progressPercentage,
        overdueTasks,
      };
    })
    .filter(emp => emp.totalTasks > 0)
    .sort((a, b) => a.progressPercentage - b.progressPercentage);

  const averageProgress = employeeProgress.length > 0
    ? Math.round(employeeProgress.reduce((sum, emp) => sum + emp.progressPercentage, 0) / employeeProgress.length)
    : 0;

  const onTrackCount = employeeProgress.filter(emp => emp.progressPercentage >= 50 && emp.overdueTasks === 0).length;
  const needsAttention = employeeProgress.filter(emp => emp.overdueTasks > 0 || emp.progressPercentage < 50).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Active Onboardings</p>
                <p className="text-3xl font-bold text-indigo-600">{employeeProgress.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">On Track</p>
                <p className="text-3xl font-bold text-emerald-600">{onTrackCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Needs Attention</p>
                <p className="text-3xl font-bold text-amber-600">{needsAttention}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Overall Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={averageProgress} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-indigo-600">{averageProgress}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Employee Progress List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Employee Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeProgress.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No active onboardings</p>
            ) : (
              employeeProgress.map(emp => (
                <div key={emp.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={emp.avatar_url} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                          {emp.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-slate-900">{emp.full_name}</h4>
                        <p className="text-sm text-slate-500">{emp.job_title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{emp.progressPercentage}%</p>
                      <p className="text-xs text-slate-500">
                        {emp.completedTasks} / {emp.totalTasks} tasks
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={emp.progressPercentage} className="h-2 mb-3" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {emp.overdueTasks > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          {emp.overdueTasks} overdue
                        </div>
                      )}
                      {emp.progressPercentage === 100 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete!
                        </div>
                      )}
                    </div>
                    <Link to={createPageUrl("Onboarding")}>
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}