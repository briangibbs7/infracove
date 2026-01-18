import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Users } from "lucide-react";

export default function OrgChart({ employees, onContact }) {
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

  const hierarchy = buildHierarchy();

  const EmployeeNode = ({ employee, level = 0 }) => {
    const hasReports = employee.reports && employee.reports.length > 0;

    return (
      <div className="relative">
        <div className={`flex flex-col items-center ${level > 0 ? 'mt-8' : ''}`}>
          <Card className="w-80 border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.avatar_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {employee.full_name?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{employee.full_name}</h3>
                  <p className="text-sm text-slate-500 truncate">{employee.job_title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                    {hasReports && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {employee.reports.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {employee.email && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onContact(employee, 'email')}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </Button>
                )}
                {employee.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onContact(employee, 'phone')}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {hasReports && (
            <div className="relative mt-8">
              <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2 -translate-y-8" />
              <div className="flex justify-center gap-8 flex-wrap">
                {employee.reports.map((report, idx) => (
                  <div key={report.id} className="relative">
                    <div className="absolute bottom-full left-1/2 w-px h-8 bg-slate-300 -translate-x-1/2" />
                    {idx === 0 && employee.reports.length > 1 && (
                      <div className="absolute bottom-full left-1/2 h-px bg-slate-300" style={{ width: `${(employee.reports.length - 1) * 400}px`, transform: 'translateX(-50%)' }} />
                    )}
                    <EmployeeNode employee={report} level={level + 1} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex flex-col items-center gap-8 min-w-full p-8">
        {hierarchy.map(root => (
          <EmployeeNode key={root.id} employee={root} />
        ))}
      </div>
    </div>
  );
}