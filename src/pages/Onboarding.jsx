import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewHireChecklist from "@/components/onboarding/NewHireChecklist";
import OnboardingProgressDashboard from "@/components/onboarding/OnboardingProgressDashboard";
import DocumentManagement from "@/components/onboarding/DocumentManagement";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import OnboardingTemplateSelector from "@/components/onboarding/OnboardingTemplateSelector";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
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
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleData, setScheduleData] = useState({});
  const [isInitiateDialogOpen, setIsInitiateDialogOpen] = useState(false);
  const [selectedNewHire, setSelectedNewHire] = useState(null);
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

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: welcomePackets = [] } = useQuery({
    queryKey: ["welcomePackets"],
    queryFn: () => base44.entities.WelcomePacket.list(),
  });

  const { data: companyDocuments = [] } = useQuery({
    queryKey: ["companyDocuments"],
    queryFn: () => base44.entities.CompanyDocument.filter({ status: "active" }),
  });

  const { data: onboardingDocuments = [] } = useQuery({
    queryKey: ["onboardingDocuments"],
    queryFn: () => base44.entities.OnboardingDocument.list("-created_date"),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
      setIsDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] }),
  });

  const handleStatusChange = (task, newStatus) => {
    const updateData = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completed_date = new Date().toISOString().split('T')[0];
    }
    updateMutation.mutate({ id: task.id, data: updateData });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const selectedEmpId = formData.get("employee_id");
    const selectedEmp = employees.find(emp => emp.id === selectedEmpId);
    const assignedToId = formData.get("assigned_to");
    const assignedTo = employees.find(e => e.id === assignedToId);
    
    const data = {
      employee_id: selectedEmpId,
      employee_name: selectedEmp?.full_name,
      task_type: formData.get("task_type"),
      title: formData.get("title"),
      description: formData.get("description"),
      status: "pending",
      priority: formData.get("priority") || "medium",
      assigned_to: assignedToId,
      assigned_to_name: assignedTo?.full_name,
      due_date: formData.get("due_date"),
      notes: formData.get("notes"),
      order: tasks.length + 1,
    };

    await createMutation.mutateAsync(data);

    // Notify assigned user
    if (assignedToId) {
      await base44.functions.invoke("notifyTaskAssignment", {
        taskId: data.id,
        taskTitle: data.title,
        assigneeName: assignedTo.full_name,
        assigneeId: assignedToId,
        assignedBy: currentEmployee?.full_name || user?.full_name
      });
    }
  };

  const handleTaskUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      status: formData.get("status"),
      priority: formData.get("priority"),
      due_date: formData.get("due_date"),
      assigned_to: formData.get("assigned_to"),
      assigned_to_name: formData.get("assigned_to") ? employees.find(e => e.id === formData.get("assigned_to"))?.full_name : undefined,
      notes: formData.get("notes"),
    };

    if (data.status === "completed") {
      data.completed_date = new Date().toISOString().split('T')[0];
    }

    updateMutation.mutate({ id: selectedTask.id, data });
  };

  const handleGenerateEmployeeId = async (task) => {
    try {
      const response = await base44.functions.invoke('generateEmployeeId', {
        employeeName: task.employee_name,
        department: 'HR'
      });
      
      alert(`Employee ID generated: ${response.data.employeeId}`);
      updateMutation.mutate({ 
        id: task.id, 
        data: { 
          status: 'completed',
          notes: `Generated Employee ID: ${response.data.employeeId}`,
          completed_date: new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      alert('Failed to generate employee ID');
    }
  };

  const handleScheduleOrientation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await base44.functions.invoke('scheduleOrientation', {
        employeeName: scheduleData.employeeName,
        employeeEmail: formData.get('employeeEmail'),
        managerEmail: formData.get('managerEmail'),
        date: formData.get('date'),
        time: formData.get('time'),
        location: formData.get('location')
      });
      
      alert('Orientation scheduled and invites sent!');
      updateMutation.mutate({ 
        id: scheduleData.taskId, 
        data: { 
          status: 'completed',
          notes: `Orientation scheduled for ${formData.get('date')} at ${formData.get('time')}`,
          completed_date: new Date().toISOString().split('T')[0]
        }
      });
      setShowScheduleDialog(false);
    } catch (error) {
      alert('Failed to schedule orientation');
    }
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

  const isAdmin = user?.role === "admin";
  const isHR = currentEmployee?.department === "HR";
  const canManage = isAdmin || isHR;

  // New hire view data
  const myTasks = currentEmployee
    ? tasks.filter(t => t.employee_id === currentEmployee.id)
    : [];

  const myWelcomePacket = currentEmployee
    ? welcomePackets.find(w => w.employee_id === currentEmployee.id)
    : null;

  const myDocuments = [];
  if (myWelcomePacket) {
    if (myWelcomePacket.company_handbook_url) {
      myDocuments.push({ name: "Company Handbook", url: myWelcomePacket.company_handbook_url });
    }
    if (myWelcomePacket.benefits_information_url) {
      myDocuments.push({ name: "Benefits Information", url: myWelcomePacket.benefits_information_url });
    }
    if (myWelcomePacket.it_policies_url) {
      myDocuments.push({ name: "IT Policies", url: myWelcomePacket.it_policies_url });
    }
    if (myWelcomePacket.additional_documents) {
      myDocuments.push(...myWelcomePacket.additional_documents);
    }
  }

  // Add general company documents
  companyDocuments.forEach(doc => {
    if (doc.department === "all" || doc.department === currentEmployee?.department) {
      myDocuments.push({ name: doc.title, url: doc.file_url });
    }
  });

  const handleTaskComplete = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: {
        status: "completed",
        completed_date: new Date().toISOString().split('T')[0],
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        subtitle={
          canManage
            ? `${pendingTasks} pending • ${completedTasks} completed • ${overdueTasks} overdue`
            : "Your onboarding journey"
        }
        action={canManage ? () => setIsCreateDialogOpen(true) : undefined}
        actionLabel={canManage ? "Create Task" : undefined}
      >
        {canManage && (
          <Button
            onClick={() => setIsInitiateDialogOpen(true)}
            variant="outline"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Initiate Onboarding
          </Button>
        )}
      </PageHeader>

      {!canManage && currentEmployee?.status === "onboarding" ? (
        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-6">
            <NewHireChecklist
              tasks={myTasks}
              documents={myDocuments}
              onTaskComplete={handleTaskComplete}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentManagement employeeId={currentEmployee.id} />
          </TabsContent>
        </Tabs>
      ) : !canManage ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">You don't have any active onboarding tasks.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="tasks" className="text-xs md:text-sm">Tasks</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs md:text-sm">Docs</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs md:text-sm">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6 mt-6">

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
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                               <StatusBadge status={task.status} />
                               <StatusBadge status={task.priority} />
                               {task.assigned_to_name && (
                                 <span className="text-xs text-slate-500">
                                   Assigned: {task.assigned_to_name}
                                 </span>
                               )}
                               {task.due_date && (
                                 <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                                   Due: {format(parseISO(task.due_date), "MMM d, yyyy")}
                                 </span>
                               )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusIcon(task.status)}
                              
                              {task.task_type === 'create_profile' && task.title.includes('Generate') && task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateEmployeeId(task)}
                                  className="text-indigo-600"
                                >
                                  Generate ID
                                </Button>
                              )}
                              
                              {task.task_type === 'assign_equipment' && (
                                <Link to={createPageUrl('Assets')}>
                                  <Button size="sm" variant="outline">
                                    View Assets
                                  </Button>
                                </Link>
                              )}
                              
                              {task.task_type === 'schedule_orientation' && task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setScheduleData({ taskId: task.id, employeeName: task.employee_name });
                                    setShowScheduleDialog(true);
                                  }}
                                  className="text-indigo-600"
                                >
                                  Schedule
                                </Button>
                              )}
                              
                              {task.task_type === 'send_welcome_materials' && (
                                <Link to={createPageUrl('WelcomePackets')}>
                                  <Button size="sm" variant="outline">
                                    View Packets
                                  </Button>
                                </Link>
                              )}
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Manage
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
          </TabsContent>

          <TabsContent value="documents" className="space-y-6 mt-6">
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
            </div>

            {selectedEmployee === "all" ? (
              <div className="space-y-6">
                {uniqueEmployees.map(empName => {
                  const emp = employees.find(e => e.full_name === empName);
                  if (!emp) return null;
                  
                  const empDocs = onboardingDocuments.filter(d => d.employee_id === emp.id);
                  if (empDocs.length === 0) return null;

                  return (
                    <Card key={emp.id} className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg">{empName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DocumentManagement employeeId={emp.id} isManager={true} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              (() => {
                const emp = employees.find(e => e.full_name === selectedEmployee);
                return emp ? <DocumentManagement employeeId={emp.id} isManager={true} /> : null;
              })()
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <OnboardingProgressDashboard employees={employees} tasks={tasks} documents={onboardingDocuments} />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Onboarding Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Select name="employee_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "onboarding" || e.status === "active").map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type *</Label>
                <Select name="task_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_profile">Create Profile</SelectItem>
                    <SelectItem value="assign_equipment">Assign Equipment</SelectItem>
                    <SelectItem value="schedule_orientation">Schedule Orientation</SelectItem>
                    <SelectItem value="send_welcome_materials">Send Welcome Materials</SelectItem>
                    <SelectItem value="setup_accounts">Setup Accounts</SelectItem>
                    <SelectItem value="benefits_enrollment">Benefits Enrollment</SelectItem>
                    <SelectItem value="team_introduction">Team Introduction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Setup email account"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed task description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium">
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select name="assigned_to">
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <form onSubmit={handleTaskUpdate} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-1">{selectedTask.title}</h4>
                <p className="text-sm text-slate-500">{selectedTask.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">For: {selectedTask.employee_name}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={selectedTask.status} required>
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
                  <Select name="priority" defaultValue={selectedTask.priority}>
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

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={selectedTask.due_date}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select name="assigned_to" defaultValue={selectedTask.assigned_to}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active").map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
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
                  rows={3}
                />
              </div>

              {selectedTask.completed_date && (
                <div className="text-sm text-slate-500 bg-emerald-50 p-3 rounded-lg">
                  ✓ Completed on {format(parseISO(selectedTask.completed_date), "MMM d, yyyy")}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      deleteMutation.mutate(selectedTask.id);
                      setIsDialogOpen(false);
                    }
                  }}
                >
                  Delete Task
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Update Task
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Initiate Onboarding Dialog */}
      <Dialog open={isInitiateDialogOpen} onOpenChange={setIsInitiateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate Employee Onboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select New Hire</Label>
              <Select value={selectedNewHire?.id} onValueChange={(id) => setSelectedNewHire(employees.find(e => e.id === id))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active" || !e.status).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedNewHire && (
              <OnboardingTemplateSelector
                employee={selectedNewHire}
                onComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["onboardingTasks"] });
                  queryClient.invalidateQueries({ queryKey: ["onboardingDocuments"] });
                  queryClient.invalidateQueries({ queryKey: ["employees"] });
                  queryClient.invalidateQueries({ queryKey: ["trainingAssignments"] });
                  setIsInitiateDialogOpen(false);
                  setSelectedNewHire(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Orientation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleOrientation} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Input value={scheduleData.employeeName} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employeeEmail">Employee Email *</Label>
              <Input
                id="employeeEmail"
                name="employeeEmail"
                type="email"
                placeholder="employee@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerEmail">Manager Email</Label>
              <Input
                id="managerEmail"
                name="managerEmail"
                type="email"
                placeholder="manager@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Office - Main Conference Room"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Schedule & Send Invites
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}