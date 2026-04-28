import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, ChevronDown, ChevronRight, Mail, Phone, MapPin } from "lucide-react";
import EmployeeProfileModal from "@/components/employees/EmployeeProfileModal";

const THEME_GRADIENTS = {
  blue: "from-blue-500 to-cyan-500",
  purple: "from-purple-500 to-pink-500",
  green: "from-green-500 to-emerald-500",
  orange: "from-orange-500 to-red-500",
  pink: "from-pink-500 to-rose-500",
  slate: "from-slate-500 to-gray-500",
};

const LEVEL_COLORS = [
  "border-l-indigo-500",
  "border-l-blue-400",
  "border-l-cyan-400",
  "border-l-teal-400",
  "border-l-green-400",
];

function OrgNode({ node, level, onSelect, collapsedNodes, toggleCollapse, employees }) {
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = collapsedNodes.has(node.id);
  const gradient = THEME_GRADIENTS[node.profile_theme] || THEME_GRADIENTS.blue;
  const borderColor = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
  const initials = node.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  // Count total reports (direct + indirect)
  const countAllReports = (n) => {
    if (!n.children?.length) return 0;
    return n.children.reduce((sum, c) => sum + 1 + countAllReports(c), 0);
  };
  const totalReports = countAllReports(node);

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        onClick={() => onSelect(node)}
        className={`group relative w-64 bg-white rounded-xl border-2 border-slate-200 border-l-4 ${borderColor} shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer`}
      >
        {/* Gradient accent top bar based on level 0 */}
        {level === 0 && (
          <div className={`h-1.5 w-full bg-gradient-to-r ${gradient} rounded-t-lg`} />
        )}

        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white shadow">
              <AvatarImage src={node.profile_photo} />
              <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-sm`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{node.full_name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{node.job_title || "—"}</p>
              {node.department && (
                <Badge variant="outline" className="mt-1.5 text-xs py-0 px-1.5 h-4 text-indigo-600 border-indigo-200 bg-indigo-50">
                  {node.department}
                </Badge>
              )}
            </div>
          </div>

          {/* Contact quick-view */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
            {node.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{node.email}</span>
              </div>
            )}
            {node.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span>{node.location}</span>
              </div>
            )}
          </div>

          {/* Expand / collapse footer */}
          {hasChildren && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {node.children.length} direct · {totalReports} total
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-indigo-50"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
              >
                {isCollapsed
                  ? <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                  : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Connector line down */}
      {hasChildren && !isCollapsed && (
        <div className="w-px h-8 bg-indigo-200" />
      )}

      {/* Children row */}
      {hasChildren && !isCollapsed && (
        <div className="flex gap-6 relative">
          {/* Horizontal bridge line */}
          {node.children.length > 1 && (
            <div
              className="absolute top-0 h-px bg-indigo-200"
              style={{
                left: `calc(50% - ${(node.children.length - 1) * 0.5 * (256 + 24)}px + ${(256 / 2)}px)`,
                width: `${(node.children.length - 1) * (256 + 24)}px`,
              }}
            />
          )}
          {node.children.map(child => (
            <div key={child.id} className="flex flex-col items-center">
              <div className="w-px h-8 bg-indigo-200" />
              <OrgNode
                node={child}
                level={level + 1}
                onSelect={onSelect}
                collapsedNodes={collapsedNodes}
                toggleCollapse={toggleCollapse}
                employees={employees}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const orgTree = useMemo(() => {
    if (!employees.length) return [];
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const roots = employees.filter(e => !e.manager_id || !employeeMap.has(e.manager_id));

    const buildTree = (emp) => ({
      ...emp,
      children: employees.filter(e => e.manager_id === emp.id).map(buildTree),
    });

    return roots.map(buildTree);
  }, [employees]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return orgTree;
    const q = searchQuery.toLowerCase();

    const matchesSearch = (e) =>
      e.full_name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.job_title?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q);

    const filterTree = (node) => {
      const filteredChildren = (node.children || []).map(filterTree).filter(Boolean);
      if (matchesSearch(node) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return orgTree.map(filterTree).filter(Boolean);
  }, [orgTree, searchQuery]);

  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organization Chart</h1>
          <p className="text-slate-500 mt-1">
            {employees.length} employees · click any card for full details
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border border-slate-200 p-8 overflow-x-auto min-h-64">
        <div className="inline-block min-w-full">
          {filteredTree.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">
                {searchQuery ? "No employees match your search" : "No employees in the organization"}
              </p>
            </div>
          ) : (
            <div className="flex gap-12 justify-center">
              {filteredTree.map(root => (
                <OrgNode
                  key={root.id}
                  node={root}
                  level={0}
                  onSelect={setSelectedEmployee}
                  collapsedNodes={collapsedNodes}
                  toggleCollapse={toggleCollapse}
                  employees={employees}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee detail modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          open={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}