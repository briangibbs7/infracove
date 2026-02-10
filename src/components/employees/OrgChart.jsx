import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Mail, Phone, Users, Search, MoreVertical, MessageCircle, UserCircle, CalendarClock, FileText, X, ChevronDown, ChevronUp } from "lucide-react";

export default function OrgChart({ employees, onContact, onMessage, onViewProfile, onRequestTimeOff }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Build organizational hierarchy
  const buildHierarchy = () => {
    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.id, { ...emp, reports: [] }));
    
    const roots = [];
    employeeMap.forEach(emp => {
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        employeeMap.get(emp.manager_id).reports.push(emp);
      } else {
        roots.push(emp);
      }
    });
    
    return roots;
  };

  // Filter employees based on search and department
  const filterEmployees = (empList) => {
    return empList.filter(emp => {
      const matchesSearch = !searchQuery || 
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = filterDepartment === "all" || emp.department === filterDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  };

  const filteredEmployees = filterEmployees(employees);
  const hierarchy = buildHierarchy();

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const toggleNodeExpansion = (employeeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const EmployeeNode = ({ employee, level = 0 }) => {
    const hasReports = employee.reports && employee.reports.length > 0;
    const isExpanded = expandedNodes.has(employee.id);
    const isHighlighted = filteredEmployees.some(e => e.id === employee.id);
    const visibleReports = employee.reports.filter(r => filteredEmployees.some(e => e.id === r.id));

    // If not highlighted by filter, show dimmed
    if (!isHighlighted && (searchQuery || filterDepartment !== "all")) {
      return null;
    }

    return (
      <div className="relative">
        <div className={`flex flex-col items-center ${level > 0 ? 'mt-8' : ''}`}>
          <Card className={`w-80 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer ${isHighlighted && (searchQuery || filterDepartment !== "all") ? 'ring-2 ring-indigo-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3" onClick={() => setSelectedEmployee(employee)}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {employee.full_name?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{employee.full_name}</h3>
                  <p className="text-sm text-slate-500 truncate">{employee.job_title}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                    {hasReports && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {employee.reports.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmployee(employee);
                    }}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      if (onMessage) onMessage(employee);
                    }}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onContact(employee, 'email');
                    }}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </DropdownMenuItem>
                    {employee.phone && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onContact(employee, 'phone');
                      }}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                    )}
                    {onRequestTimeOff && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onRequestTimeOff(employee);
                      }}>
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Request Time Off
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {hasReports && visibleReports.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => toggleNodeExpansion(employee.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              {(isExpanded || level === 0) && (
                <div className="relative mt-8">
                  <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2 -translate-y-8" />
                  <div className="flex justify-center gap-8 flex-wrap">
                    {visibleReports.map((report, idx) => (
                      <div key={report.id} className="relative">
                        <div className="absolute bottom-full left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2" />
                        {idx === 0 && visibleReports.length > 1 && (
                          <div className="absolute bottom-full left-1/2 h-px bg-slate-300" style={{ width: `${(visibleReports.length - 1) * 400}px`, transform: 'translateX(-50%)' }} />
                        )}
                        <EmployeeNode employee={report} level={level + 1} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterDepartment("all");
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search employees by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || filterDepartment !== "all") && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        <div className="text-sm text-slate-600">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Org Chart */}
      <div className="overflow-x-auto pb-8">
        <div className="inline-flex flex-col items-center gap-8 min-w-full p-8">
          {hierarchy.map(root => (
            <EmployeeNode key={root.id} employee={root} />
          ))}
        </div>
      </div>

      {/* Employee Details Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedEmployee.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-semibold">
                    {selectedEmployee.full_name?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedEmployee.full_name}</h2>
                  <p className="text-lg text-slate-600">{selectedEmployee.job_title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{selectedEmployee.department}</Badge>
                    <Badge variant="outline">{selectedEmployee.status || "active"}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-slate-900">{selectedEmployee.email}</p>
                </div>
                {selectedEmployee.phone && (
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="text-slate-900">{selectedEmployee.phone}</p>
                  </div>
                )}
                {selectedEmployee.location && (
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="text-slate-900">{selectedEmployee.location}</p>
                  </div>
                )}
                {selectedEmployee.manager_name && (
                  <div>
                    <p className="text-sm text-slate-500">Reports To</p>
                    <p className="text-slate-900">{selectedEmployee.manager_name}</p>
                  </div>
                )}
                {selectedEmployee.start_date && (
                  <div>
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="text-slate-900">{new Date(selectedEmployee.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedEmployee.reports && selectedEmployee.reports.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500">Direct Reports</p>
                    <p className="text-slate-900">{selectedEmployee.reports.length} employees</p>
                  </div>
                )}
              </div>

              {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    if (onMessage) onMessage(selectedEmployee);
                    setSelectedEmployee(null);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    onContact(selectedEmployee, 'email');
                    setSelectedEmployee(null);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                {onViewProfile && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      onViewProfile(selectedEmployee);
                      setSelectedEmployee(null);
                    }}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Full Profile
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}