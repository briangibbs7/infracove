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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  UserMinus,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  ShieldOff,
  FileText,
  DollarSign,
  Filter,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function Offboarding() {
  const [user, setUser] = useState(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: offboardingTasks = [] } = useQuery({
    queryKey: ["offboardingTasks"],
    queryFn: () => base44.entities.OffboardingTask.list("-created_date"),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.OffboardingTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboardingTasks"] });
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OffboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboardingTasks"] });
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.OffboardingTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboardingTasks"] });
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const createTasksFromTemplate = () => {
    if (!selectedEmployee) return;

    const templates = [
      // IT Tasks
      { title: "Revoke system access", task_type: "revoke_access", department: "IT", priority: "urgent", description: "Disable all system accounts and access credentials" },
      { title: "Collect laptop and equipment", task_type: "return_equipment", department: "IT", priority: "high", description: "Retrieve company laptop, monitors, peripherals" },
      { title: "Deactivate email account", task_type: "deactivate_accounts", department: "IT", priority: "urgent", description: "Deactivate email and forward to manager" },
      { title: "Remove from shared drives", task_type: "revoke_access", department: "IT", priority: "medium", description: "Remove access to shared folders and cloud storage" },
      
      // HR Tasks
      { title: "Conduct exit interview", task_type: "exit_interview", department: "HR", priority: "high", description: "Schedule and conduct exit interview" },
      { title: "Process benefits termination", task_type: "benefits_termination", department: "HR", priority: "high", description: "Terminate health insurance and other benefits" },
      { title: "Collect company ID badge", task_type: "collect_company_property", department: "HR", priority: "medium", description: "Retrieve employee ID badge and access cards" },
      { title: "Update employee status", task_type: "other", department: "HR", priority: "urgent", description: "Update employee status to terminated in system" },
      
      // Finance Tasks
      { title: "Process final paycheck", task_type: "final_paycheck", department: "Finance", priority: "urgent", description: "Calculate and process final paycheck including unused PTO" },
      { title: "Collect corporate credit card", task_type: "collect_company_property", department: "Finance", priority: "high", description: "Retrieve and cancel corporate credit card" },
      { title: "Clear expense reports", task_type: "other", department: "Finance", priority: "medium", description: "Process any pending expense reimbursements" },
      
      // Department-specific
      { title: "Knowledge transfer session", task_type: "knowledge_transfer", department: "HR", priority: "high", description: "Facilitate knowledge transfer to team members" },
      { title: "Collect company documents", task_type: "collect_company_property", department: "Legal", priority: "medium", description: "Retrieve any confidential documents or files" },
    ];

    templates.forEach((template, index) => {
      createTaskMutation.mutate({
        ...template,
        employee_id: selectedEmployee,
        employee_name: employees.find(e => e.id === selectedEmployee)?.full_name,
        status: "pending",
        order: index + 1,
      });
    });

    setIsTemplateDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleSubmitTask = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const employeeId = formData.get("employee_id");
    const assignedToId = formData.get("assigned_to");
    const employee = employees.find(emp => emp.id === employeeId);
    const assignedTo = employees.find(emp => emp.id === assignedToId);

    const data = {
      employee_id: employeeId,
      employee_name: employee?.full_name,
      task_type: formData.get("task_type"),
      title: formData.get("title"),
      description: formData.get("description"),
      department: formData.get("department"),
      status: formData.get("status") || "pending",
      priority: formData.get("priority") || "medium",
      assigned_to: assignedToId,
      assigned_to_name: assignedTo?.full_name,
      due_date: formData.get("due_date"),
      last_working_day: formData.get("last_working_day"),
      notes: formData.get("notes"),
    };

    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  // Group tasks by employee
  const tasksByEmployee = offboardingTasks.reduce((acc, task) => {
    const empId = task.employee_id;
    if (!acc[empId]) {
      acc[empId] = [];
    }
    acc[empId].push(task);
    return acc;
  }, {});

  // Filter tasks
  const filteredTasks = offboardingTasks.filter(task => {
    const deptMatch = departmentFilter === "all" || task.department === departmentFilter;
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    return deptMatch && statusMatch;
  });

  // Stats
  const pendingTasks = offboardingTasks.filter(t => t.status === "pending").length;
  const completedTasks = offboardingTasks.filter(t => t.status === "completed").length;
  const activeOffboarding = Object.keys(tasksByEmployee).length;
  const overdueTasks = offboardingTasks.filter(t => 
    t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date))
  ).length;

  return (
    <div>
      <PageHeader
        title="Employee Offboarding"
        subtitle={`${activeOffboarding} active offboarding • ${pendingTasks} pending tasks`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            Use Template
          </Button>
          <Button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskDialogOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Active Offboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900">{activeOffboarding}</div>
              <UserMinus className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-600">{pendingTasks}</div>
              <Clock className="w-8 h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-600">{completedTasks}</div>
              <CheckCircle2 className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{overdueTasks}</div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 mb-6">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="IT">IT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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

      <Tabs defaultValue="by-employee" className="w-full">
        <TabsList>
          <TabsTrigger value="by-employee">By Employee</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="by-employee" className="space-y-6 mt-6">
          {Object.keys(tasksByEmployee).length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <UserMinus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No active offboarding</h3>
                <p className="text-slate-500 mb-4">Start by creating offboarding tasks for an employee</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(tasksByEmployee).map(([empId, tasks]) => {
              const employee = employees.find(e => e.id === empId);
              const completed = tasks.filter(t => t.status === "completed").length;
              const total = tasks.length;
              const progress = (completed / total) * 100;

              return (
                <Card key={empId} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{tasks[0].employee_name}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          {employee?.job_title} • {employee?.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{completed} / {total} tasks</p>
                        <div className="w-32 h-2 bg-slate-200 rounded-full mt-2">
                          <div 
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div 
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskDialogOpen(true);
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{task.title}</p>
                              <StatusBadge status={task.priority} />
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              {task.department} • {task.assigned_to_name || "Unassigned"}
                            </p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all-tasks" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <StatusBadge status={task.priority} />
                        </div>
                        <p className="text-sm text-slate-500">
                          {task.employee_name} • {task.department} • {task.assigned_to_name || "Unassigned"}
                        </p>
                        {task.due_date && (
                          <p className={`text-xs mt-1 ${isPast(parseISO(task.due_date)) && task.status !== "completed" ? "text-red-600" : "text-slate-400"}`}>
                            Due: {format(parseISO(task.due_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask ? "Edit Task" : "Create Offboarding Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Select name="employee_id" defaultValue={selectedTask?.employee_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" defaultValue={selectedTask?.department} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type *</Label>
              <Select name="task_type" defaultValue={selectedTask?.task_type} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return_equipment">Return Equipment</SelectItem>
                  <SelectItem value="revoke_access">Revoke Access</SelectItem>
                  <SelectItem value="knowledge_transfer">Knowledge Transfer</SelectItem>
                  <SelectItem value="exit_interview">Exit Interview</SelectItem>
                  <SelectItem value="final_paycheck">Final Paycheck</SelectItem>
                  <SelectItem value="benefits_termination">Benefits Termination</SelectItem>
                  <SelectItem value="collect_company_property">Collect Company Property</SelectItem>
                  <SelectItem value="deactivate_accounts">Deactivate Accounts</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={selectedTask?.title}
                placeholder="e.g., Revoke system access"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedTask?.description}
                placeholder="Task details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedTask?.status || "pending"}>
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
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue={selectedTask?.priority || "medium"}>
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

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={selectedTask?.due_date}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select name="assigned_to" defaultValue={selectedTask?.assigned_to}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_working_day">Last Working Day</Label>
                <Input
                  id="last_working_day"
                  name="last_working_day"
                  type="date"
                  defaultValue={selectedTask?.last_working_day}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={selectedTask?.notes}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              {selectedTask && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this task?")) {
                      deleteTaskMutation.mutate(selectedTask.id);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                {selectedTask ? "Update" : "Create"} Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tasks from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will create a comprehensive set of offboarding tasks across all departments for the selected employee.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="template_employee">Select Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium text-slate-900">Template includes:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>IT: Access revocation, equipment collection (4 tasks)</li>
                <li>HR: Exit interview, benefits termination (4 tasks)</li>
                <li>Finance: Final paycheck, expense clearance (3 tasks)</li>
                <li>Legal: Document collection (1 task)</li>
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createTasksFromTemplate}
                disabled={!selectedEmployee}
                className="bg-red-600 hover:bg-red-700"
              >
                Create Tasks
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}