import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { Users, Mail, Phone, MapPin, Calendar, Search, Filter, MoreVertical, Pencil, Trash2, Award, Network, Grid3x3, MessageCircle } from "lucide-react";
import EmployeeDetailsDialog from "@/components/employees/EmployeeDetailsDialog";
import OrgChart from "@/components/employees/OrgChart";
import MessagingDialog from "@/components/communications/MessagingDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEPARTMENTS = ["HR", "Finance", "Sales", "Legal", "IT", "Marketing", "Operations", "Executive"];
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractor", "intern"];
const STATUSES = ["active", "onboarding", "on_leave", "terminated"];

export default function Employees() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [messagingRecipient, setMessagingRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [filterSkill, setFilterSkill] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list("-created_date"),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      department: formData.get("department"),
      job_title: formData.get("job_title"),
      employment_type: formData.get("employment_type"),
      status: formData.get("status") || "active",
      start_date: formData.get("start_date"),
      location: formData.get("location"),
      salary: formData.get("salary") ? parseFloat(formData.get("salary")) : undefined,
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDetailsUpdate = (detailsData) => {
    if (editingEmployee) {
      updateMutation.mutate({
        id: editingEmployee.id,
        data: { ...editingEmployee, ...detailsData }
      });
      setIsDetailsDialogOpen(false);
    }
  };

  const handleContact = (employee, type) => {
    if (type === 'email') {
      window.location.href = `mailto:${employee.email}`;
    } else if (type === 'phone') {
      window.location.href = `tel:${employee.phone}`;
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || emp.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    const matchesEmploymentType = filterEmploymentType === "all" || emp.employment_type === filterEmploymentType;
    const matchesManager = filterManager === "all" || emp.manager_id === filterManager;
    const matchesSkill = !filterSkill || (emp.skills && emp.skills.some(s => s.toLowerCase().includes(filterSkill.toLowerCase())));
    return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType && matchesManager && matchesSkill;
  });

  const managers = employees.filter(e => 
    employees.some(emp => emp.manager_id === e.id)
  );

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${filteredEmployees.length} of ${employees.length} team members`}
        action={() => {
          setEditingEmployee(null);
          setIsDialogOpen(true);
        }}
        actionLabel="Add Employee"
      >
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "org" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("org")}
          >
            <Network className="w-4 h-4 mr-2" />
            Org Chart
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, title, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
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

          <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
            <SelectTrigger>
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterManager} onValueChange={setFilterManager}>
            <SelectTrigger>
              <SelectValue placeholder="Manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map((mgr) => (
                <SelectItem key={mgr.id} value={mgr.id}>{mgr.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by skill..."
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          />
        </div>
      </div>

      {/* View Content */}
      {viewMode === "org" ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <OrgChart employees={filteredEmployees} onContact={handleContact} />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Get started by adding your first team member"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Employee"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={employee.avatar_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                        {employee.full_name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
                      <p className="text-sm text-slate-500">{employee.job_title}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setMessagingRecipient(employee);
                          setIsMessagingOpen(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Basic Info
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Manage Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(employee.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleContact(employee, 'email')}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors w-full"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{employee.email}</span>
                  </button>
                  {employee.phone && (
                    <button
                      onClick={() => handleContact(employee, 'phone')}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors w-full"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{employee.phone}</span>
                    </button>
                  )}
                  {employee.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{employee.location}</span>
                    </div>
                  )}
                  {employee.start_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Started {format(new Date(employee.start_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {employee.skills && employee.skills.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{employee.skills.slice(0, 3).join(", ")}</span>
                      {employee.skills.length > 3 && <span className="text-xs">+{employee.skills.length - 3}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={employee.status || "active"} />
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {employee.department}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => handleContact(employee, 'email')}
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details - {editingEmployee?.full_name}</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeDetailsDialog
              employee={editingEmployee}
              onUpdate={handleDetailsUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={editingEmployee?.full_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingEmployee?.email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingEmployee?.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" defaultValue={editingEmployee?.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  defaultValue={editingEmployee?.job_title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select name="employment_type" defaultValue={editingEmployee?.employment_type || "full_time"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingEmployee?.status || "active"}>
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
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={editingEmployee?.start_date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingEmployee?.location}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  defaultValue={editingEmployee?.salary}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingEmployee ? "Update" : "Create"} Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Messaging Dialog */}
      <MessagingDialog
        isOpen={isMessagingOpen}
        onClose={() => {
          setIsMessagingOpen(false);
          setMessagingRecipient(null);
        }}
        recipient={messagingRecipient}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}