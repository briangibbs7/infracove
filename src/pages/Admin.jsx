import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/ui/PageHeader";
import LeaveBalanceManager from "@/components/admin/LeaveBalanceManager";
import {
  Shield,
  Users,
  Settings,
  UserPlus,
  Building2,
  Database,
  Activity,
  Mail,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Archive,
  UserX,
  Edit2,
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [appFormData, setAppFormData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: appLinks = [] } = useQuery({
    queryKey: ["appLinks"],
    queryFn: () => base44.entities.AppLink.list(),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setEditingUser(null);
    },
  });

  const createAppMutation = useMutation({
    mutationFn: (data) => base44.entities.AppLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
      toast.success("App created successfully");
      setAppDialogOpen(false);
      setAppFormData({});
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
      toast.success("App updated successfully");
      setAppDialogOpen(false);
      setEditingApp(null);
      setAppFormData({});
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => base44.entities.AppLink.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appLinks"] });
      toast.success("App deleted successfully");
    },
  });

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error("Failed to send invitation");
    }
  };

  const handleUpdateEmployeeDepartment = (employeeId, department) => {
    updateEmployeeMutation.mutate({
      id: employeeId,
      data: { department },
    });
  };

  const handleUpdateEmployeeRole = (employeeId, role) => {
    updateEmployeeMutation.mutate({
      id: employeeId,
      data: { role },
    });
  };

  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;
    updateEmployeeMutation.mutate({
      id: userToDeactivate.id,
      data: { status: "inactive" },
    });
    setDeactivateDialogOpen(false);
    setUserToDeactivate(null);
  };

  const handleReactivateUser = (employeeId) => {
    updateEmployeeMutation.mutate({
      id: employeeId,
      data: { status: "active" },
    });
  };

  const handleBulkUpdate = (field, value) => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    selectedUsers.forEach((userId) => {
      updateEmployeeMutation.mutate({
        id: userId,
        data: { [field]: value },
      });
    });

    setSelectedUsers([]);
    setBulkEditDialogOpen(false);
    toast.success(`Updated ${selectedUsers.length} users`);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredEmployees.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredEmployees.map((emp) => emp.id));
    }
  };

  const handleSaveApp = () => {
    if (!appFormData.name || !appFormData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingApp) {
      updateAppMutation.mutate({ id: editingApp.id, data: appFormData });
    } else {
      createAppMutation.mutate({
        ...appFormData,
        is_active: true,
      });
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      searchQuery === "" ||
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || emp.status === statusFilter || (!emp.status && statusFilter === "active");

    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;

    const matchesRole = roleFilter === "all" || emp.role === roleFilter || (!emp.role && roleFilter === "user");

    return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-muted-foreground mt-2">
                  You need administrator privileges to access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allDepartments = [
    "HR", "Human Resources", "Finance", "Legal", "IT", "Information Technology",
    "Corporate", "Engineering", "Software Engineers", "Software", "Systems",
    "Design", "Industrial Design", "Manufacturing", "Customer Experience",
    "Accounting", "Business Development", "Business/Finance", "Repair Station",
    "Quality", "Procurement", "Production", "Program Management"
  ];

  const departmentStats = {};
  allDepartments.forEach(dept => {
    departmentStats[dept] = employees.filter(e => e.department === dept).length;
  });

  const stats = {
    totalUsers: users.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    adminUsers: users.filter(u => u.role === "admin").length,
    departments: departmentStats,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        subtitle="Manage users, roles, and system settings"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.activeEmployees}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.adminUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{allDepartments.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Briefcase className="w-4 h-4 mr-2" />
            App Marketplace
          </TabsTrigger>
          <TabsTrigger value="rbac">
            <Shield className="w-4 h-4 mr-2" />
            RBAC
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and invitations ({filteredEmployees.length} of {employees.length})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setBulkEditDialogOpen(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Bulk Edit ({selectedUsers.length})
                </Button>
              )}
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Employee</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== "all" || departmentFilter !== "all" || roleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDepartmentFilter("all");
                      setRoleFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(emp.id)}
                            onChange={() => toggleUserSelection(emp.id)}
                            className="rounded border-slate-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>
                          <Badge variant={emp.role === "admin" ? "default" : "secondary"}>
                            {emp.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{emp.department || "Unassigned"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              (emp.status === "active" || !emp.status)
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {emp.status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(emp)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            {(emp.status === "active" || !emp.status) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUserToDeactivate(emp);
                                  setDeactivateDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Archive className="w-3 h-3 mr-1" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReactivateUser(emp.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Marketplace Tab */}
        <TabsContent value="apps" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">App Marketplace</h2>
              <p className="text-sm text-muted-foreground">
                Manage application shortcuts for employees ({appLinks.filter(a => a.is_active).length} active)
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingApp(null);
                setAppFormData({});
                setAppDialogOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add App
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appLinks.filter(a => a.is_active).map((app) => (
                  <div key={app.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{app.name}</h3>
                            <p className="text-xs text-muted-foreground">{app.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{app.department}</Badge>
                          {app.is_featured && (
                            <Badge className="bg-green-100 text-green-700">Featured</Badge>
                          )}
                          {app.requires_login && (
                            <Badge variant="outline">Login Required</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingApp(app);
                            setAppFormData(app);
                            setAppDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(app.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAppMutation.mutate(app.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {appLinks.filter(a => a.is_active).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No apps created yet. Add your first app to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RBAC Tab */}
        <TabsContent value="rbac" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Role-Based Access Control</h2>
            <p className="text-sm text-muted-foreground">Configure role permissions and access levels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Role</CardTitle>
                <CardDescription>Full system access and management capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">User Management</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Full Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">All Departments</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Full Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Analytics & Reports</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Full Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">System Settings</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Full Access
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employee Role</CardTitle>
                <CardDescription>Department-specific access with limited permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">User Management</span>
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      No Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Own Department Only</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      Limited Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Analytics & Reports</span>
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      No Access
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">System Settings</span>
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      No Access
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Access Rules</CardTitle>
              <CardDescription>Control which departments users can access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allDepartments.filter(dept => stats.departments[dept] > 0).map((dept, idx) => {
                  const colors = [
                    "text-indigo-600", "text-blue-600", "text-purple-600", "text-pink-600",
                    "text-rose-600", "text-orange-600", "text-amber-600", "text-yellow-600",
                    "text-lime-600", "text-green-600", "text-emerald-600", "text-teal-600",
                    "text-cyan-600", "text-sky-600", "text-violet-600", "text-fuchsia-600",
                    "text-red-600", "text-slate-600", "text-gray-600", "text-zinc-600"
                  ];
                  const colorClass = colors[idx % colors.length];
                  
                  return (
                    <div key={dept} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className={`w-5 h-5 ${colorClass}`} />
                        <div>
                          <p className="font-medium text-slate-900">{dept} Department</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.departments[dept]} employees
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">Admins: Full Access</Badge>
                        <Badge variant="outline">{dept} Members: Full Access</Badge>
                        <Badge variant="outline" className="text-red-600">Others: No Access</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Departments</h2>
            <p className="text-sm text-muted-foreground">Overview of departments and their members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(stats.departments).filter(([_, count]) => count > 0).map(([dept, count], idx) => {
              const colors = [
                { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
                { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
                { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
                { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
                { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
                { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
                { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
                { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
                { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
                { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
                { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
                { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
                { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200" },
                { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
                { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
              ];
              const colorScheme = colors[idx % colors.length];
              
              return (
                <Card key={dept} className={`${colorScheme.border} border-2`}>
                  <CardHeader className={colorScheme.bg}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">{dept}</CardTitle>
                      <Badge className={`${colorScheme.bg} ${colorScheme.text}`}>{count} employees</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {employees
                        .filter(e => e.department === dept)
                        .slice(0, 5)
                        .map((emp) => (
                          <div key={emp.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium">{emp.full_name}</p>
                              <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {emp.role || "user"}
                            </Badge>
                          </div>
                        ))}
                      {count > 5 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          +{count - 5} more employees
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
            <p className="text-sm text-muted-foreground">Configure backend and system-wide settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Manage email notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">System-wide email settings</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
              <CardDescription>Database status and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-lg font-bold">
                      {employees.length + users.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-bold text-green-600">Operational</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employee</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} className="bg-indigo-600 hover:bg-indigo-700">
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editingUser.full_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={editingUser.department}
                  onValueChange={(dept) => handleUpdateEmployeeDepartment(editingUser.id, dept)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role || "user"}
                  onValueChange={(role) => handleUpdateEmployeeRole(editingUser.id, role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Employee</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingUser.status || "active"}
                  onValueChange={(status) =>
                    updateEmployeeMutation.mutate({ id: editingUser.id, data: { status } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Balance Manager (inside Edit Dialog) */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Employee - {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="leave">Leave Balances</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingUser.full_name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={editingUser.department}
                    onValueChange={(dept) => handleUpdateEmployeeDepartment(editingUser.id, dept)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role || "user"}
                    onValueChange={(role) => handleUpdateEmployeeRole(editingUser.id, role)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Employee</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingUser.status || "active"}
                    onValueChange={(status) =>
                      updateEmployeeMutation.mutate({ id: editingUser.id, data: { status } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="leave" className="mt-4">
                <LeaveBalanceManager employee={editingUser} />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Users ({selectedUsers.length} selected)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Update Department</Label>
              <Select onValueChange={(dept) => handleBulkUpdate("department", dept)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Update Role</Label>
              <Select onValueChange={(role) => handleBulkUpdate("role", role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employee</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Update Status</Label>
              <Select onValueChange={(status) => handleBulkUpdate("status", status)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
          </DialogHeader>
          {userToDeactivate && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-slate-900">
                    Are you sure you want to deactivate {userToDeactivate.full_name}?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will restrict their access to the system. You can reactivate them later.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeactivateUser}
              className="bg-red-600 hover:bg-red-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Deactivate User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit App Dialog */}
      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit App" : "Add New App"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>App Name *</Label>
                <Input
                  placeholder="e.g., Gmail"
                  value={appFormData.name || ""}
                  onChange={(e) => setAppFormData({ ...appFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={appFormData.icon || "Grid"}
                  onValueChange={(value) => setAppFormData({ ...appFormData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mail">Mail</SelectItem>
                    <SelectItem value="Calendar">Calendar</SelectItem>
                    <SelectItem value="Briefcase">Briefcase</SelectItem>
                    <SelectItem value="MessageCircle">Message</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="FileText">File</SelectItem>
                    <SelectItem value="BookOpen">Book</SelectItem>
                    <SelectItem value="Grid">Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of the app"
                value={appFormData.description || ""}
                onChange={(e) => setAppFormData({ ...appFormData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                placeholder="https://example.com"
                value={appFormData.url || ""}
                onChange={(e) => setAppFormData({ ...appFormData, url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={appFormData.category || "other"}
                  onValueChange={(value) => setAppFormData({ ...appFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={appFormData.department || "all"}
                  onValueChange={(value) => setAppFormData({ ...appFormData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appFormData.requires_login || false}
                  onChange={(e) => setAppFormData({ ...appFormData, requires_login: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">Requires Login</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appFormData.is_featured || false}
                  onChange={(e) => setAppFormData({ ...appFormData, is_featured: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">Featured (Show by default)</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApp} className="bg-indigo-600 hover:bg-indigo-700">
              {editingApp ? "Update" : "Create"} App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}