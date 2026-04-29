import React, { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import {
  Users, Mail, Phone, MapPin, Calendar, Search, Filter,
  MoreVertical, Pencil, Trash2, Award, Network, Grid3x3,
  MessageCircle, Shield, Briefcase, ChevronDown, ChevronRight, Sparkles,
} from "lucide-react";
import MessagingDialog from "@/components/communications/MessagingDialog";
import EmployeeDetailsDialog from "@/components/employees/EmployeeDetailsDialog";
import EnhancedProfileModal from "@/components/employees/EnhancedProfileModal";
import EmployeeProfile from "@/components/employees/EmployeeProfile";
import EmployeeDetailModal from "@/components/directory/EmployeeDetailModal";
import EmployeeProfileModal from "@/components/employees/EmployeeProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SkillsInput from "@/components/employees/SkillsInput";
import ProfileCompletenessIndicator from "@/components/employees/ProfileCompletenessIndicator";

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractor", "intern"];
const STATUSES = ["active", "onboarding", "on_leave", "terminated"];

const THEME_GRADIENTS = {
  blue: "from-blue-500 to-cyan-500",
  purple: "from-purple-500 to-pink-500",
  green: "from-green-500 to-emerald-500",
  orange: "from-orange-500 to-red-500",
  pink: "from-pink-500 to-rose-500",
  slate: "from-slate-500 to-gray-500",
};
const LEVEL_COLORS = [
  "border-l-indigo-500", "border-l-blue-400", "border-l-cyan-400",
  "border-l-teal-400", "border-l-green-400",
];

// ─── Org Chart Node ──────────────────────────────────────────────────────────
function OrgNode({ node, level, onSelect, collapsedNodes, toggleCollapse }) {
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = collapsedNodes.has(node.id);
  const initials = node.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const countAll = (n) => (n.children || []).reduce((s, c) => s + 1 + countAll(c), 0);
  const totalReports = countAll(node);

  // Role-based coloring
  const getRoleColor = () => {
    const title = (node.job_title || "").toLowerCase();
    if (title.includes("president") || title.includes("ceo") || title.includes("founder")) {
      return { bg: "bg-slate-600", text: "text-white", avatar: "bg-gradient-to-br from-slate-600 to-slate-700" };
    }
    if (title.includes("director") || title.includes("vp") || title.includes("vice")) {
      return { bg: "bg-teal-500", text: "text-white", avatar: "bg-gradient-to-br from-teal-400 to-cyan-500" };
    }
    return { bg: "bg-red-500", text: "text-white", avatar: "bg-gradient-to-br from-red-400 to-rose-500" };
  };

  const colors = getRoleColor();

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => onSelect(node)}
        className={`group relative ${colors.bg} ${colors.text} rounded-3xl px-6 py-4 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer min-w-max`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 flex-shrink-0 ring-4 ring-white shadow-lg">
            <AvatarImage src={node.profile_photo} />
            <AvatarFallback className={`${colors.avatar} font-bold text-lg`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm">{node.full_name}</p>
            <p className="text-xs opacity-90">{node.job_title || "Team Member"}</p>
          </div>
        </div>
      </div>

      {hasChildren && !isCollapsed && <div className="w-0.5 h-6 bg-teal-400" />}

      {hasChildren && !isCollapsed && (
        <div className="flex gap-8 relative">
          {node.children.length > 1 && (
            <div
              className="absolute -top-6 h-0.5 bg-teal-400"
              style={{
                left: `calc(50% - ${(node.children.length - 1) * 0.5 * (200 + 32)}px + ${100}px)`,
                width: `${(node.children.length - 1) * (200 + 32)}px`,
              }}
            />
          )}
          {node.children.map(child => (
            <div key={child.id} className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-teal-400" />
              <OrgNode node={child} level={level + 1} onSelect={onSelect} collapsedNodes={collapsedNodes} toggleCollapse={toggleCollapse} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Employees() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEnhancedProfileOpen, setIsEnhancedProfileOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [orgSelectedEmployee, setOrgSelectedEmployee] = useState(null);
  const [messagingRecipient, setMessagingRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  // Directory-specific filters
  const [dirSearch, setDirSearch] = useState("");
  const [dirDept, setDirDept] = useState("all");
  const [dirLocation, setDirLocation] = useState("all");
  const [dirSkills, setDirSkills] = useState([]);
  const [dirSelectedEmployee, setDirSelectedEmployee] = useState(null);
  // Org chart
  const [orgSearch, setOrgSearch] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list("-created_date"),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => base44.entities.Department.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); setIsDialogOpen(false); setEditingEmployee(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); setIsDialogOpen(false); setIsDetailsDialogOpen(false); setEditingEmployee(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    // Duplicate email detection
    const existingWithEmail = employees.find(emp => emp.email === email && emp.id !== editingEmployee?.id);
    if (existingWithEmail) {
      alert(`A record with email "${email}" already exists (${existingWithEmail.full_name}). Please use a unique email.`);
      return;
    }
    const managerId = formData.get("manager_id");
    const selectedManager = employees.find(e => e.id === managerId);
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
      manager_id: managerId || undefined,
      manager_name: selectedManager?.full_name || undefined,
    };
    if (editingEmployee) { updateMutation.mutate({ id: editingEmployee.id, data }); }
    else { createMutation.mutate(data); }
  };

  const handleDetailsUpdate = (detailsData) => {
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data: detailsData });
  };

  // ── Grid filtered employees ──
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.job_title?.toLowerCase().includes(q) ||
      emp.location?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      (emp.skills && emp.skills.some(s => s.toLowerCase().includes(q)));
    const matchesDept = filterDepartment === "all" || emp.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    const matchesMgr = filterManager === "all" || emp.manager_id === filterManager;
    return matchesSearch && matchesDept && matchesStatus && matchesMgr;
  });

  const managers = employees.filter(e => employees.some(emp => emp.manager_id === e.id));

  // ── Directory filtered employees ──
  const dirFiltered = useMemo(() => {
    const q = dirSearch.toLowerCase();
    return employees.filter(e => {
      const matchesSearch = !q || e.full_name?.toLowerCase().includes(q) || e.job_title?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q);
      const matchesDept = dirDept === "all" || e.department === dirDept;
      const matchesLoc = dirLocation === "all" || e.location === dirLocation;
      const matchesSkills = dirSkills.length === 0 || (e.skills && dirSkills.some(skill => e.skills.includes(skill)));
      return matchesSearch && matchesDept && matchesLoc && matchesSkills;
    });
  }, [employees, dirSearch, dirDept, dirLocation, dirSkills]);

  const dirDepartments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(), [employees]);
  const dirLocations = useMemo(() => [...new Set(employees.map(e => e.location).filter(Boolean))].sort(), [employees]);

  // ── Org tree ──
  const orgTree = useMemo(() => {
    if (!employees.length) return [];
    const empMap = new Map(employees.map(e => [e.id, e]));
    const roots = employees.filter(e => !e.manager_id || !empMap.has(e.manager_id));
    const buildTree = (emp) => ({ ...emp, children: employees.filter(e => e.manager_id === emp.id).map(buildTree) });
    return roots.map(buildTree);
  }, [employees]);

  const filteredOrgTree = useMemo(() => {
    if (!orgSearch.trim()) return orgTree;
    const q = orgSearch.toLowerCase();
    const matches = (e) => e.full_name?.toLowerCase().includes(q) || e.job_title?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q);
    const filterTree = (node) => {
      const filteredChildren = (node.children || []).map(filterTree).filter(Boolean);
      return (matches(node) || filteredChildren.length > 0) ? { ...node, children: filteredChildren } : null;
    };
    return orgTree.map(filterTree).filter(Boolean);
  }, [orgTree, orgSearch]);

  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  return (
    <div>
      <PageHeader
        title="People"
        subtitle={`${employees.length} team members`}
        action={() => { setEditingEmployee(null); setIsDialogOpen(true); }}
        actionLabel="Add Employee"
      />

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" /> Employees
          </TabsTrigger>
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Directory
          </TabsTrigger>
          <TabsTrigger value="org" className="flex items-center gap-2">
            <Network className="w-4 h-4" /> Org Chart
          </TabsTrigger>
        </TabsList>

        {/* ── GRID TAB ── */}
        <TabsContent value="grid" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name, email, title, department, skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="border-indigo-100 bg-indigo-50/40">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Manager</Label>
                    <Select value={filterManager} onValueChange={setFilterManager}>
                      <SelectTrigger><SelectValue placeholder="All Managers" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Managers</SelectItem>
                        {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <Card key={i} className="animate-pulse"><CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={Users} title="No employees found" description="Add your first team member" action={() => setIsDialogOpen(true)} actionLabel="Add Employee" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => (
                <Card key={employee.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={employee.profile_photo || employee.avatar_url} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
                            {employee.full_name?.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
                          <p className="text-sm text-slate-500">{employee.job_title}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setMessagingRecipient(employee); setIsMessagingOpen(true); }}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingEmployee(employee); setIsDialogOpen(true); }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit Basic Info
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedEmployee(employee); setIsEnhancedProfileOpen(true); }}>
                            <Award className="w-4 h-4 mr-2" /> View Enhanced Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingEmployee(employee); setIsDetailsDialogOpen(true); }}>
                            <Shield className="w-4 h-4 mr-2" /> Edit Skills & Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(employee.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      {employee.email && (
                        <a href={`mailto:${employee.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Mail className="w-4 h-4 text-slate-400" /><span className="truncate">{employee.email}</span>
                        </a>
                      )}
                      {employee.phone && (
                        <a href={`tel:${employee.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400" /><span>{employee.phone}</span>
                        </a>
                      )}
                      {employee.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" /><span>{employee.location}</span>
                        </div>
                      )}
                      {employee.start_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" /><span>Started {format(new Date(employee.start_date), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {employee.skills && employee.skills.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {employee.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{skill}</span>
                          ))}
                          {employee.skills.length > 4 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">+{employee.skills.length - 4}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={employee.status || "active"} />
                        {employee.department && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{employee.department}</span>}
                      </div>
                    </div>
                    <ProfileCompletenessIndicator employee={employee} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── DIRECTORY TAB ── */}
         <TabsContent value="directory" className="space-y-4">
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input placeholder="Search by name, title, email, or department..." value={dirSearch} onChange={e => setDirSearch(e.target.value)} className="pl-9" />
             </div>
             <Select value={dirDept} onValueChange={setDirDept}>
               <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Department" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Departments</SelectItem>
                 {dirDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
               </SelectContent>
             </Select>
             <Select value={dirLocation} onValueChange={setDirLocation}>
               <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Location" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Locations</SelectItem>
                 {dirLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>

           <Card className="border-indigo-100 bg-indigo-50/40 p-4">
             <div className="space-y-2">
               <Label className="flex items-center gap-2 text-sm font-medium">
                 <Sparkles className="w-4 h-4 text-indigo-600" />
                 Filter by Skills
               </Label>
               <SkillsInput skills={dirSkills} onSkillsChange={setDirSkills} />
             </div>
           </Card>

          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Users className="w-4 h-4" /> {dirFiltered.length} of {employees.length} employees
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100" />
                    <div className="space-y-1.5 flex-1"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dirFiltered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dirFiltered.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => setDirSelectedEmployee(emp)}
                  className="rounded-xl border bg-white p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={emp.profile_photo} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm">
                        {emp.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{emp.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{emp.job_title || "—"}</p>
                    </div>
                  </div>
                  {emp.department && (
                    <Badge variant="outline" className="text-xs font-medium text-indigo-600 border-indigo-200 bg-indigo-50">
                      {emp.department}
                    </Badge>
                  )}
                  <div className="space-y-1.5 text-sm text-slate-600">
                    {emp.email && (
                      <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 hover:text-indigo-600 transition-colors truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span className="truncate">{emp.email}</span>
                      </a>
                    )}
                    {emp.phone && (
                      <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span>{emp.phone}</span>
                      </a>
                    )}
                    {emp.location && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span>{emp.location}</span>
                      </div>
                    )}
                    {emp.manager_name && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /><span className="truncate">Reports to {emp.manager_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <EmployeeDetailModal employee={dirSelectedEmployee} open={!!dirSelectedEmployee} onClose={() => setDirSelectedEmployee(null)} />
        </TabsContent>

        {/* ── ORG CHART TAB ── */}
        <TabsContent value="org" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-slate-500">{employees.length} employees · click any card for details</p>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search employees..." value={orgSearch} onChange={e => setOrgSearch(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border border-slate-200 p-8 overflow-x-auto min-h-64">
            <div className="inline-block min-w-full">
              {filteredOrgTree.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">{orgSearch ? "No employees match your search" : "No employees in the organization"}</p>
                </div>
              ) : (
                <div className="flex gap-12 justify-center">
                  {filteredOrgTree.map(root => (
                    <OrgNode key={root.id} node={root} level={0} onSelect={setOrgSelectedEmployee} collapsedNodes={collapsedNodes} toggleCollapse={toggleCollapse} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {orgSelectedEmployee && (
            <EmployeeProfileModal employee={orgSelectedEmployee} open={!!orgSelectedEmployee} onClose={() => setOrgSelectedEmployee(null)} />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Employee Profile</DialogTitle></DialogHeader>
          {selectedEmployee && (
            <EmployeeProfile
              employee={selectedEmployee}
              employees={employees}
              onMessage={emp => { setMessagingRecipient(emp); setIsMessagingOpen(true); }}
              onEdit={emp => { setEditingEmployee(emp); setIsDetailsDialogOpen(true); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Employee Details — {editingEmployee?.full_name}</DialogTitle></DialogHeader>
          {editingEmployee && <EmployeeDetailsDialog employee={editingEmployee} onUpdate={handleDetailsUpdate} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" name="full_name" defaultValue={editingEmployee?.full_name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" defaultValue={editingEmployee?.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingEmployee?.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select name="department" defaultValue={editingEmployee?.department}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_id">Manager</Label>
                <Select name="manager_id" defaultValue={editingEmployee?.manager_id || ""}>
                  <SelectTrigger><SelectValue placeholder="Select manager (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No Manager</SelectItem>
                    {employees.filter(e => e.id !== editingEmployee?.id).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name} — {emp.job_title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input id="job_title" name="job_title" defaultValue={editingEmployee?.job_title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select name="employment_type" defaultValue={editingEmployee?.employment_type || "full_time"}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingEmployee?.status || "active"}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={editingEmployee?.start_date} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={editingEmployee?.location} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input id="salary" name="salary" type="number" defaultValue={editingEmployee?.salary} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingEmployee ? "Update" : "Create"} Employee</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MessagingDialog
        isOpen={isMessagingOpen}
        onClose={() => { setIsMessagingOpen(false); setMessagingRecipient(null); }}
        recipient={messagingRecipient}
        currentEmployee={currentEmployee}
      />

      <EnhancedProfileModal
        employee={selectedEmployee}
        open={isEnhancedProfileOpen}
        onOpenChange={setIsEnhancedProfileOpen}
      />
    </div>
  );
}