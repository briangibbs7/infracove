import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, TrendingUp, FileText, Heart, Mail, Briefcase, Building2 } from "lucide-react";

import ContactInfoSection from "@/components/myprofile/ContactInfoSection";
import CompensationSection from "@/components/myprofile/CompensationSection";
import EquitySection from "@/components/myprofile/EquitySection";
import PayslipsSection from "@/components/myprofile/PayslipsSection";
import BenefitsSection from "@/components/myprofile/BenefitsSection";

export default function MyProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
    enabled: !!currentUser,
  });

  const employee = employees.find(e => e.email === currentUser?.email);

  const { data: payrolls = [] } = useQuery({
    queryKey: ["my-payrolls", employee?.id],
    queryFn: () => base44.entities.Payroll.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ["my-payslips", employee?.id],
    queryFn: () => base44.entities.Payslip.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: grants = [] } = useQuery({
    queryKey: ["my-grants", employee?.id],
    queryFn: () => base44.entities.EquityGrant.filter({ shareholder_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ["my-enrollments", employee?.id],
    queryFn: () => base44.entities.BenefitEnrollment.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: benefits = [] } = useQuery({
    queryKey: ["benefits"],
    queryFn: () => base44.entities.Benefit.list(),
  });

  const handleEmployeeUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 border-4 border-white/30">
            <AvatarImage src={employee?.profile_photo} />
            <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
              {(employee?.full_name || currentUser?.full_name || "U").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{employee?.full_name || currentUser?.full_name}</h1>
            <p className="text-indigo-200">{employee?.job_title || "Employee"}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-indigo-100">
              {employee?.department && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {employee.department}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {currentUser?.email}
              </span>
              {employee?.status && (
                <Badge className="bg-white/20 text-white border-white/30 text-xs capitalize">
                  {employee.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact" className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="compensation" className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Compensation</span>
          </TabsTrigger>
          <TabsTrigger value="equity" className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Equity</span>
          </TabsTrigger>
          <TabsTrigger value="payslips" className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pay Stubs</span>
          </TabsTrigger>
          <TabsTrigger value="benefits" className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Benefits</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-4">
          {employee ? (
            <ContactInfoSection employee={employee} onUpdated={handleEmployeeUpdated} />
          ) : (
            <p className="text-slate-400 text-sm italic">No employee profile found linked to your account.</p>
          )}
        </TabsContent>

        <TabsContent value="compensation" className="mt-4">
          <CompensationSection payrolls={payrolls} />
        </TabsContent>

        <TabsContent value="equity" className="mt-4">
          <EquitySection grants={grants} />
        </TabsContent>

        <TabsContent value="payslips" className="mt-4">
          <PayslipsSection payslips={payslips} />
        </TabsContent>

        <TabsContent value="benefits" className="mt-4">
          {employee ? (
            <BenefitsSection
              employee={employee}
              enrollments={enrollments}
              availableBenefits={benefits}
              onRefresh={refetchEnrollments}
            />
          ) : (
            <p className="text-slate-400 text-sm italic">No employee profile found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}