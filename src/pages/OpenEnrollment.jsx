import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/ui/PageHeader";
import { Calendar, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export default function OpenEnrollment() {
  const [enrollmentPeriod, setEnrollmentPeriod] = useState({
    start: "2026-11-01",
    end: "2026-11-30",
    year: 2027,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["benefitEnrollments"],
    queryFn: () => base44.entities.BenefitEnrollment.list(),
  });

  const { data: benefits = [] } = useQuery({
    queryKey: ["benefits"],
    queryFn: () => base44.entities.Benefit.filter({ is_active: true }),
  });

  const activeEmployees = employees.filter((e) => e.status === "active");
  const enrolledEmployees = new Set(
    enrollments.filter((e) => e.status === "active").map((e) => e.employee_id)
  ).size;
  const enrollmentRate = activeEmployees.length > 0
    ? Math.round((enrolledEmployees / activeEmployees.length) * 100)
    : 0;

  const isEnrollmentOpen = () => {
    const today = new Date();
    const start = new Date(enrollmentPeriod.start);
    const end = new Date(enrollmentPeriod.end);
    return today >= start && today <= end;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Enrollment"
        subtitle="Manage annual benefits enrollment period"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Enrollment Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-bold">
                {isEnrollmentOpen() ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nov 1 - Nov 30, 2026
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Enrolled Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">
                {enrolledEmployees} / {activeEmployees.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{enrollmentRate}%</span>
            </div>
            <Progress value={enrollmentRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Available Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{benefits.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Status by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeEmployees.map((employee) => {
              const employeeEnrollments = enrollments.filter(
                (e) => e.employee_id === employee.id && e.status === "active"
              );
              const hasEnrolled = employeeEnrollments.length > 0;

              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.department} • {employeeEnrollments.length} plans
                      enrolled
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasEnrolled ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enrolled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}