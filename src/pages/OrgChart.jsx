import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ChevronDown, ChevronUp } from "lucide-react";
import EmployeeProfileModal from "@/components/employees/EmployeeProfileModal";
import { Button } from "@/components/ui/button";

export default function OrgChart() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  // Build org tree structure
  const orgTree = useMemo(() => {
    if (!employees.length) return [];

    // Find root employees (no manager or manager not in the system)
    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
    const roots = employees.filter(emp => !emp.manager_id || !employeeMap.has(emp.manager_id));

    // Recursive function to build tree
    const buildTree = (employee) => {
      const directReports = employees.filter(emp => emp.manager_id === employee.id);
      return {
        ...employee,
        children: directReports.map(buildTree),
      };
    };

    return roots.map(buildTree);
  }, [employees]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return orgTree;

    const query = searchQuery.toLowerCase();
    const matchesSearch = (emp) => {
      return (
        emp.full_name?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.job_title?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
      );
    };

    const filterTree = (node) => {
      const matches = matchesSearch(node);
      const filteredChildren = node.children?.map(filterTree).filter(Boolean) || [];
      
      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return orgTree.map(filterTree).filter(Boolean);
  }, [orgTree, searchQuery]);

  const toggleCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowProfileModal(true);
  };

  const OrgNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const directReportsCount = node.children?.length || 0;

    const themeColors = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
      slate: "from-slate-500 to-slate-600",
    };

    const gradient = themeColors[node.profile_theme] || themeColors.blue;

    return (
      <div className="flex flex-col items-center">
        {/* Employee Card */}
        <Card 
          className="w-72 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-400"
          onClick={() => handleEmployeeClick(node)}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarImage src={node.profile_photo} />
                <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-semibold text-lg`}>
                  {node.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-slate-900 truncate">
                  {node.full_name}
                </h3>
                <p className="text-sm text-slate-600 truncate">{node.job_title || "No title"}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {node.department || "No dept"}
                </Badge>
              </div>
            </div>
            {hasChildren && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {directReportsCount} direct report{directReportsCount !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(node.id);
                  }}
                  className="h-6 px-2"
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Line */}
        {hasChildren && !isCollapsed && (
          <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-400 to-indigo-300" />
        )}

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex gap-8 relative">
            {/* Horizontal connecting line */}
            {node.children.length > 1 && (
              <div 
                className="absolute top-0 h-0.5 bg-indigo-300"
                style={{
                  left: '50%',
                  right: '50%',
                  width: `${(node.children.length - 1) * 19}rem`,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
            
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Vertical line to child */}
                <div className="w-0.5 h-12 bg-indigo-300" />
                <OrgNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading organization chart...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organization Chart</h1>
          <p className="text-slate-600 mt-1">
            Visual hierarchy of {employees.length} employees
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Org Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-8 overflow-x-auto">
        <div className="inline-block min-w-full">
          {filteredTree.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchQuery ? "No employees found matching your search" : "No employees in organization"}
              </p>
            </div>
          ) : (
            <div className="flex gap-12 justify-center">
              {filteredTree.map((root) => (
                <OrgNode key={root.id} node={root} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          open={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}