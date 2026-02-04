import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Plus,
  FolderKanban,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Target,
  FileText
} from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Projects() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: projectTasks = [] } = useQuery({
    queryKey: ["projectTasks"],
    queryFn: () => base44.entities.ProjectTask.list(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowDialog(false);
      setEditingProject(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowDialog(false);
      setEditingProject(null);
      setViewDialog(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setViewDialog(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      department: formData.get("department"),
      start_date: formData.get("start_date") || undefined,
      due_date: formData.get("due_date") || undefined,
      budget: formData.get("budget") ? parseFloat(formData.get("budget")) : undefined,
      project_manager: formData.get("project_manager") || undefined,
      project_manager_name: employees.find(e => e.id === formData.get("project_manager"))?.full_name,
      notes: formData.get("notes"),
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowDialog(true);
    setViewDialog(false);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.budget_spent || 0), 0);
  const overdueTasks = projectTasks.filter(t => 
    t.status !== "completed" && t.due_date && isPast(parseISO(t.due_date))
  ).length;

  const getProjectTasks = (projectId) => projectTasks.filter(t => t.project_id === projectId);
  const getProjectAssets = (projectId) => {
    // Assuming assets might have a project_id field or notes containing project reference
    return assets.filter(a => a.notes?.includes(projectId));
  };

  const getProjectStatus = (project) => {
    if (project.status === "completed") return { color: "emerald", icon: CheckCircle };
    if (project.status === "active") return { color: "blue", icon: Clock };
    if (project.status === "on_hold") return { color: "amber", icon: AlertCircle };
    if (project.status === "cancelled") return { color: "red", icon: AlertCircle };
    return { color: "slate", icon: FolderKanban };
  };

  const isOverdue = (project) => {
    return project.due_date && isPast(parseISO(project.due_date)) && project.status !== "completed";
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Projects"
        subtitle="Manage and track project progress"
        action={() => setShowDialog(true)}
        actionLabel="New Project"
        icon={<Plus className="w-4 h-4 mr-2" />}
      />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Active Projects</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{activeProjects}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-blue-100">
                <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Completed</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{completedProjects}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-emerald-100">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Total Budget</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">${(totalBudget / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500 mt-1">${(totalSpent / 1000).toFixed(0)}K spent</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-amber-100">
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Overdue Tasks</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{overdueTasks}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredProjects.map((project) => {
          const StatusIcon = getProjectStatus(project).icon;
          const tasks = getProjectTasks(project.id);
          const completedTasks = tasks.filter(t => t.status === "completed").length;
          const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
          
          return (
            <Card
              key={project.id}
              className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isOverdue(project) ? "border-l-4 border-red-500" : ""
              }`}
              onClick={() => {
                setSelectedProject(project);
                setViewDialog(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900 truncate">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={project.status} />
                      <Badge className={`bg-${getProjectStatus(project).color}-100 text-${getProjectStatus(project).color}-700 text-xs`}>
                        {project.priority}
                      </Badge>
                      {project.department && (
                        <Badge variant="outline" className="text-xs">{project.department}</Badge>
                      )}
                    </div>
                  </div>
                  <StatusIcon className={`w-5 h-5 text-${getProjectStatus(project).color}-600 flex-shrink-0`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-xs md:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500">Task Progress</span>
                    <span className="font-medium text-slate-900">{taskProgress}%</span>
                  </div>
                  <Progress value={taskProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {project.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Due Date</p>
                        <p className={`text-xs font-medium ${
                          isOverdue(project) ? "text-red-600" : "text-slate-900"
                        }`}>
                          {format(parseISO(project.due_date), "MMM d")}
                        </p>
                      </div>
                    </div>
                  )}
                  {project.team_members && project.team_members.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Team</p>
                        <p className="text-xs font-medium text-slate-900">
                          {project.team_members.length} members
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {project.budget && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Budget</span>
                      <span className="text-xs font-medium text-slate-900">
                        ${(project.budget_spent || 0).toLocaleString()} / ${project.budget.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-50" />
            <p className="text-slate-500">No projects found</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project Name *</label>
              <Input
                name="name"
                defaultValue={editingProject?.name}
                required
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                name="description"
                defaultValue={editingProject?.description}
                placeholder="Project description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Status *</label>
                <Select name="status" defaultValue={editingProject?.status || "planning"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Priority *</label>
                <Select name="priority" defaultValue={editingProject?.priority || "medium"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Department</label>
                <Select name="department" defaultValue={editingProject?.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Project Manager</label>
                <Select name="project_manager" defaultValue={editingProject?.project_manager}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <Input
                  type="date"
                  name="start_date"
                  defaultValue={editingProject?.start_date}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Due Date</label>
                <Input
                  type="date"
                  name="due_date"
                  defaultValue={editingProject?.due_date}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Budget</label>
                <Input
                  type="number"
                  name="budget"
                  defaultValue={editingProject?.budget}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <Textarea
                name="notes"
                defaultValue={editingProject?.notes}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                setEditingProject(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingProject ? "Update" : "Create"} Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      {selectedProject && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl mb-2">{selectedProject.name}</DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selectedProject.status} />
                    <Badge className="bg-indigo-100 text-indigo-700">{selectedProject.priority}</Badge>
                    {selectedProject.department && (
                      <Badge variant="outline">{selectedProject.department}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(selectedProject)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(selectedProject.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {selectedProject.description && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                    <p className="text-sm text-slate-600">{selectedProject.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProject.project_manager_name && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Project Manager</p>
                      <p className="text-sm font-medium text-slate-900">{selectedProject.project_manager_name}</p>
                    </div>
                  )}
                  {selectedProject.start_date && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {format(parseISO(selectedProject.start_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                  {selectedProject.due_date && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Due Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {format(parseISO(selectedProject.due_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                  {selectedProject.budget && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Budget</p>
                      <p className="text-sm font-medium text-slate-900">
                        ${selectedProject.budget.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedProject.team_members && selectedProject.team_members.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Team Members</h4>
                    <div className="space-y-2">
                      {selectedProject.team_members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-900">{member.employee_name}</span>
                          {member.role && <Badge variant="outline" className="text-xs">{member.role}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.notes && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedProject.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">Project Tasks</h4>
                  <Link to={createPageUrl("ProjectTasks") + `?project=${selectedProject.id}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {getProjectTasks(selectedProject.id).length > 0 ? (
                    getProjectTasks(selectedProject.id).map(task => (
                      <div key={task.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <StatusBadge status={task.status} />
                              {task.assigned_to_name && (
                                <span className="text-xs text-slate-500">{task.assigned_to_name}</span>
                              )}
                              {task.due_date && (
                                <span className="text-xs text-slate-500">
                                  Due {format(parseISO(task.due_date), "MMM d")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No tasks yet</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Associated Assets</h4>
                    <div className="space-y-2">
                      {getProjectAssets(selectedProject.id).length > 0 ? (
                        getProjectAssets(selectedProject.id).map(asset => (
                          <div key={asset.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{asset.name}</p>
                              <p className="text-xs text-slate-500">{asset.type}</p>
                            </div>
                            <StatusBadge status={asset.status} />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No assets linked yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}