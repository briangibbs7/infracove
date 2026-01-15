import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { HeadphonesIcon, MoreVertical, Pencil, Check, Search, AlertCircle } from "lucide-react";

const CATEGORIES = ["hardware", "software", "network", "access", "email", "security", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"];

export default function Support() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.SupportTicket.list("-created_date"),
  });

  const { data: itEmployees = [] } = useQuery({
    queryKey: ["it-employees"],
    queryFn: () => base44.entities.Employee.filter({ department: "IT" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setIsDialogOpen(false);
      setEditingTicket(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setIsDialogOpen(false);
      setEditingTicket(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assignee = itEmployees.find((emp) => emp.id === formData.get("assigned_to"));
    
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority") || "medium",
      status: formData.get("status") || "open",
      assigned_to: formData.get("assigned_to") || null,
      assigned_to_name: assignee?.full_name || null,
      resolution: formData.get("resolution"),
      submitted_by: editingTicket?.submitted_by || user?.email,
      submitted_by_name: editingTicket?.submitted_by_name || user?.full_name,
    };

    if (editingTicket) {
      if (data.status === "resolved" && editingTicket.status !== "resolved") {
        data.resolved_date = new Date().toISOString().split("T")[0];
      }
      updateMutation.mutate({ id: editingTicket.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleQuickResolve = (ticket) => {
    updateMutation.mutate({
      id: ticket.id,
      data: {
        status: "resolved",
        resolved_date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const criticalTickets = tickets.filter((t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed").length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "border-l-red-500 bg-red-50";
      case "high": return "border-l-orange-500 bg-orange-50";
      case "medium": return "border-l-amber-500 bg-amber-50";
      default: return "border-l-slate-300 bg-slate-50";
    }
  };

  return (
    <div>
      <PageHeader
        title="IT Support"
        subtitle={`${openTickets} open tickets${criticalTickets > 0 ? ` • ${criticalTickets} critical` : ""}`}
        action={() => {
          setEditingTicket(null);
          setIsDialogOpen(true);
        }}
        actionLabel="Create Ticket"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority.replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState
            icon={HeadphonesIcon}
            title="No tickets found"
            description="Create a support ticket to get help"
            action={() => setIsDialogOpen(true)}
            actionLabel="Create Ticket"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`border-0 shadow-sm border-l-4 ${getPriorityColor(ticket.priority)} transition-all hover:shadow-md`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                      {ticket.priority === "critical" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <StatusBadge status={ticket.status} />
                      <StatusBadge status={ticket.priority} />
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 capitalize">
                        {ticket.category?.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {ticket.submitted_by_name || "Unknown"}
                      </span>
                      {ticket.assigned_to_name && (
                        <>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-600 font-medium">
                            {ticket.assigned_to_name}
                          </span>
                        </>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">
                        {ticket.created_date && format(new Date(ticket.created_date), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {ticket.status !== "resolved" && ticket.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleQuickResolve(ticket)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingTicket(ticket);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket" : "Create Support Ticket"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingTicket?.title}
                required
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingTicket?.description}
                required
                placeholder="Provide details about the issue..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingTicket?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue={editingTicket?.priority || "medium"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingTicket && user?.role === "admin" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingTicket?.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Select name="assigned_to" defaultValue={editingTicket?.assigned_to}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Unassigned</SelectItem>
                        {itEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    name="resolution"
                    defaultValue={editingTicket?.resolution}
                    placeholder="How was this issue resolved?"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingTicket ? "Update" : "Create"} Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}