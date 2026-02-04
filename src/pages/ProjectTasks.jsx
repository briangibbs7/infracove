import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Upload,
  Download
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function ProjectTasks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingFile, setUploadingFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["projectTasks"],
    queryFn: () => base44.entities.ProjectTask.list("-created_date"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      setShowDialog(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      setShowDialog(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      project_id: formData.get("project_id"),
      project_name: projects.find(p => p.id === formData.get("project_id"))?.name,
      title: formData.get("title"),
      description: formData.get("description"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      assigned_to: formData.get("assigned_to") || undefined,
      assigned_to_name: employees.find(e => e.id === formData.get("assigned_to"))?.full_name,
      due_date: formData.get("due_date") || undefined,
      estimated_hours: formData.get("estimated_hours") ? parseFloat(formData.get("estimated_hours")) : undefined,
      notes: formData.get("notes"),
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleFileUpload = async (taskId, file) => {
    setUploadingFile(taskId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const task = tasks.find(t => t.id === taskId);
      const attachments = task.attachments || [];
      attachments.push({ file_name: file.name, file_url });
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { attachments }
      });
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setUploadingFile(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === "all" || task.project_id === selectedProject;
    return matchesSearch && matchesProject;
  });

  const groupedByStatus = {
    todo: filteredTasks.filter(t => t.status === "todo"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    review: filteredTasks.filter(t => t.status === "review"),
    completed: filteredTasks.filter(t => t.status === "completed"),
    blocked: filteredTasks.filter(t => t.status === "blocked"),
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Project Tasks"
        subtitle="Manage tasks across all projects"
        action={() => setShowDialog(true)}
        actionLabel="New Task"
        icon={<Plus className="w-4 h-4 mr-2" />}
      />

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {Object.entries(groupedByStatus).map(([status, statusTasks]) => (
          <Card key={status} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="capitalize">{status.replace(/_/g, " ")}</span>
                <Badge variant="outline">{statusTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusTasks.map(task => {
                const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "completed";
                return (
                  <Card
                    key={task.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      isOverdue ? "border-l-4 border-red-500" : ""
                    }`}
                    onClick={() => {
                      setEditingTask(task);
                      setShowDialog(true);
                    }}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-slate-900 text-sm mb-2">{task.title}</p>
                      <div className="space-y-2">
                        {task.project_name && (
                          <Badge variant="outline" className="text-xs">{task.project_name}</Badge>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={task.priority} />
                          {task.assigned_to_name && (
                            <span className="text-xs text-slate-500">{task.assigned_to_name}</span>
                          )}
                        </div>
                        {task.due_date && (
                          <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                            Due {format(parseISO(task.due_date), "MMM d")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {statusTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No tasks</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Project *</label>
              <Select name="project_id" defaultValue={editingTask?.project_id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Task Title *</label>
              <Input
                name="title"
                defaultValue={editingTask?.title}
                required
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                name="description"
                defaultValue={editingTask?.description}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Status *</label>
                <Select name="status" defaultValue={editingTask?.status || "todo"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Priority *</label>
                <Select name="priority" defaultValue={editingTask?.priority || "medium"}>
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

              <div>
                <label className="text-sm font-medium text-slate-700">Assign To</label>
                <Select name="assigned_to" defaultValue={editingTask?.assigned_to}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
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
                <label className="text-sm font-medium text-slate-700">Due Date</label>
                <Input
                  type="date"
                  name="due_date"
                  defaultValue={editingTask?.due_date}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Estimated Hours</label>
                <Input
                  type="number"
                  name="estimated_hours"
                  defaultValue={editingTask?.estimated_hours}
                  placeholder="0"
                  step="0.5"
                />
              </div>
            </div>

            {editingTask && editingTask.attachments && editingTask.attachments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Attachments</label>
                <div className="space-y-2">
                  {editingTask.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100"
                    >
                      <span className="text-sm text-slate-900">{att.file_name}</span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <Textarea
                name="notes"
                defaultValue={editingTask?.notes}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {editingTask && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => {
                    if (confirm("Delete this task?")) {
                      deleteTaskMutation.mutate(editingTask.id);
                      setShowDialog(false);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                setEditingTask(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingTask ? "Update" : "Create"} Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}