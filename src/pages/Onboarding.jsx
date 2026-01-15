import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { 
  UserPlus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Laptop,
  Mail,
  Calendar,
  FileText,
  Users as UsersIcon,
  Shield,
  Zap
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const TASK_ICONS = {
  create_profile: UserPlus,
  assign_equipment: Laptop,
  schedule_orientation: Calendar,
  send_welcome_materials: Mail,
  setup_accounts: Shield,
  benefits_enrollment: FileText,
  team_introduction: UsersIcon,
  other: Zap
};

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["onboardingTasks"],
    queryFn: () => base44.entities.OnboardingTask.list("-order"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
      setIsDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const handleStatusChange = (task, newStatus) => {
    const updateData = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completed_date = new Date().toISOString().split('T')[0];
    }
    updateMutation.mutate({ id: task.id, data: updateData });
  };

  const handleTaskUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      status: formData.get("status"),
      notes: formData.get("notes"),
    };

    if (data.status === "completed") {
      data.completed_date = new Date().toISOString().split('T')[0];
    }

    updateMutation.mutate({ id: selectedTask.id, data });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const employeeMatch = selectedEmployee === "all" || task.employee_name === selectedEmployee;
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    return employeeMatch && statusMatch;
  });

  // Group tasks by employee
  const tasksByEmployee = filteredTasks.reduce((acc, task) => {
    const key = task.employee_name || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  // Stats
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const overdueTasks = tasks.filter(t => 
    t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date))
  ).length;

  const getTaskIcon = (taskType) => {
    const Icon = TASK_ICONS[taskType] || Zap;
    return Icon;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const uniqueEmployees = [...new Set(tasks.map(t => t.employee_name).filter(Boolean))];

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        subtitle={`${pendingTasks} pending • ${completedTasks} completed • ${overdueTasks} overdue`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingTasks}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{completedTasks}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {uniqueEmployees.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-slate-500">Loading onboarding tasks...</p>
          </CardContent>
        </Card>
      ) : Object.keys(tasksByEmployee).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No onboarding tasks</h3>
              <p className="text-slate-500">
                Onboarding tasks are automatically created when employment contracts are signed
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(tasksByEmployee).map(([employeeName, employeeTasks]) => (
            <Card key={employeeName} className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{employeeName}</CardTitle>
                  <div className="text-sm text-slate-500">
                    {employeeTasks.filter(t => t.status === "completed").length} / {employeeTasks.length} completed
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeTasks.map(task => {
                    const Icon = getTaskIcon(task.task_type);
                    const isOverdue = task.status !== "completed" && task.due_date && isPast(parseISO(task.due_date));
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                          task.status === "completed" 
                            ? "bg-emerald-50 border-emerald-200" 
                            : isOverdue
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Icon className={`w-5 h-5 ${
                            task.status === "completed" 
                              ? "text-emerald-600" 
                              : isOverdue 
                              ? "text-red-600"
                              : "text-indigo-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className={`font-medium ${
                                task.status === "completed" ? "line-through text-slate-500" : "text-slate-900"
                              }`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <StatusBadge status={task.status} />
                                <StatusBadge status={task.priority} />
                                {task.due_date && (
                                  <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                                    Due: {format(parseISO(task.due_date), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <form onSubmit={handleTaskUpdate} className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">{selectedTask.title}</h4>
                <p className="text-sm text-slate-500">{selectedTask.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedTask.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedTask.notes}
                  placeholder="Add any notes or updates..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Update Task
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}