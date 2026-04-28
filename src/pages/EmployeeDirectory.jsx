import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Briefcase, Phone, Mail, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  on_leave: "bg-yellow-100 text-yellow-700",
};

export default function EmployeeDirectory() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees-directory"],
    queryFn: () => base44.entities.Employee.filter({ status: "active" }),
  });

  const departments = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
    return depts;
  }, [employees]);

  const locations = useMemo(() => {
    const locs = [...new Set(employees.map(e => e.location).filter(Boolean))].sort();
    return locs;
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e => {
      const matchesSearch =
        !q ||
        e.full_name?.toLowerCase().includes(q) ||
        e.job_title?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q);
      const matchesDept = deptFilter === "all" || e.department === deptFilter;
      const matchesLocation = locationFilter === "all" || e.location === locationFilter;
      return matchesSearch && matchesDept && matchesLocation;
    });
  }, [employees, search, deptFilter, locationFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Find contact details and office information for your colleagues</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span>{filtered.length} of {employees.length} employees</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, title, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No employees found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => (
            <div
              key={emp.id}
              className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow space-y-4"
            >
              {/* Avatar + Name */}
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

              {/* Department badge */}
              {emp.department && (
                <Badge variant="outline" className="text-xs font-medium text-indigo-600 border-indigo-200 bg-indigo-50">
                  {emp.department}
                </Badge>
              )}

              {/* Contact details */}
              <div className="space-y-1.5 text-sm text-slate-600">
                {emp.email && (
                  <a
                    href={`mailto:${emp.email}`}
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors truncate"
                  >
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </a>
                )}
                {emp.phone && (
                  <a
                    href={`tel:${emp.phone}`}
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span>{emp.phone}</span>
                  </a>
                )}
                {emp.location && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span>{emp.location}</span>
                  </div>
                )}
                {emp.manager_name && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">Reports to {emp.manager_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}