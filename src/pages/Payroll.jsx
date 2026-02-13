import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Plus, DollarSign, Calendar, Users, Download, FileText, TrendingUp, Eye, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Payroll() {
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => base44.entities.Payroll.list("-pay_date"),
  });

  const { data: benefitEnrollments = [] } = useQuery({
    queryKey: ["benefitEnrollments"],
    queryFn: () => base44.entities.BenefitEnrollment.filter({ status: "active" }),
  });

  const createPayrollMutation = useMutation({
    mutationFn: (data) => base44.entities.Payroll.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success("Payroll record created");
      setPayrollDialogOpen(false);
      setSelectedPayroll(null);
    },
    onError: () => toast.error("Failed to create payroll"),
  });

  const updatePayrollMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payroll.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success("Payroll updated");
    },
    onError: () => toast.error("Failed to update payroll"),
  });

  const calculatePayroll = (employee, periodStart, periodEnd) => {
    const baseAmount = employee.salary || 0;
    const monthlyRate = baseAmount / 12;
    
    // Get benefit deductions for this employee
    const employeeBenefits = benefitEnrollments.filter(
      (e) => e.employee_id === employee.id && e.status === "active"
    );
    const benefitDeductions = employeeBenefits.reduce(
      (sum, b) => sum + (b.employee_contribution || 0),
      0
    );

    const grossPay = monthlyRate * 2; // Bi-weekly
    const federalTax = grossPay * 0.22;
    const stateTax = grossPay * 0.05;
    const socialSecurity = grossPay * 0.062;
    const medicare = grossPay * 0.0145;
    const totalDeductions = federalTax + stateTax + socialSecurity + medicare + benefitDeductions;
    const netPay = grossPay - totalDeductions;

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_email: employee.email,
      department: employee.department,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      pay_date: moment(periodEnd).add(5, "days").format("YYYY-MM-DD"),
      base_salary: baseAmount,
      hours_worked: 80,
      overtime_hours: 0,
      bonus: 0,
      commission: 0,
      gross_pay: grossPay,
      federal_tax: federalTax,
      state_tax: stateTax,
      social_security: socialSecurity,
      medicare: medicare,
      health_insurance: benefitDeductions,
      retirement_401k: 0,
      other_deductions: 0,
      total_deductions: totalDeductions,
      net_pay: netPay,
      status: "draft",
    };
  };

  const handleRunPayroll = () => {
    const periodEnd = moment().format("YYYY-MM-DD");
    const periodStart = moment().subtract(14, "days").format("YYYY-MM-DD");

    const activeEmployees = employees.filter((e) => e.status === "active");
    const payrollRecords = activeEmployees.map((emp) =>
      calculatePayroll(emp, periodStart, periodEnd)
    );

    Promise.all(
      payrollRecords.map((record) => base44.entities.Payroll.create(record))
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success(`Payroll run created for ${activeEmployees.length} employees`);
    });
  };

  const handleApprovePayroll = (payroll) => {
    updatePayrollMutation.mutate({
      id: payroll.id,
      data: { status: "approved" },
    });
  };

  const filteredPayrolls = payrolls.filter((p) => {
    const statusMatch = filter === "all" || p.status === filter;
    const deptMatch = departmentFilter === "all" || p.department === departmentFilter;
    return statusMatch && deptMatch;
  });

  const totalGross = filteredPayrolls.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
  const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.total_deductions || 0), 0);
  const pendingCount = payrolls.filter((p) => p.status === "pending").length;
  const paidCount = payrolls.filter((p) => p.status === "paid").length;
  
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  
  const payrollByDepartment = departments.map(dept => ({
    department: dept,
    totalGross: payrolls
      .filter(p => p.department === dept && (filter === "all" || p.status === filter))
      .reduce((sum, p) => sum + (p.gross_pay || 0), 0),
    totalNet: payrolls
      .filter(p => p.department === dept && (filter === "all" || p.status === filter))
      .reduce((sum, p) => sum + (p.net_pay || 0), 0),
    count: payrolls.filter(p => p.department === dept && (filter === "all" || p.status === filter)).length,
  })).filter(d => d.count > 0);

  const handleExportPayroll = () => {
    const csvContent = [
      ["Employee", "Department", "Period Start", "Period End", "Pay Date", "Gross Pay", "Deductions", "Net Pay", "Status"],
      ...filteredPayrolls.map(p => [
        p.employee_name,
        p.department,
        p.pay_period_start,
        p.pay_period_end,
        p.pay_date,
        p.gross_pay,
        p.total_deductions,
        p.net_pay,
        p.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payroll exported successfully");
  };

  const handleViewPayslip = (payroll) => {
    setSelectedPayroll(payroll);
    setPayslipDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Payroll Management</h1>
          <p className="mt-1 text-slate-500">Manage employee compensation and payments</p>
        </div>
        <Button onClick={handleRunPayroll} className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-200">
          <Plus className="w-4 h-4 mr-2" />
          Run Payroll
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Gross Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">
                ${totalGross.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Net Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">
                ${totalNet.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">
                ${totalDeductions.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Processed Payrolls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{paidCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrolls.slice(0, 5).map((payroll) => (
              <div key={payroll.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium">{payroll.employee_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {moment(payroll.pay_date).format("MMM D, YYYY")} • {payroll.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${payroll.net_pay?.toLocaleString()}</p>
                  <StatusBadge status={payroll.status} />
                </div>
              </div>
            ))}
            {payrolls.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records yet. Click "Run Payroll" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="records" className="space-y-6 mt-6">

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Payroll Records ({filteredPayrolls.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportPayroll}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payroll records...
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payroll records found. Click "Run Payroll" to create records.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payroll.employee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {payroll.department}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {moment(payroll.pay_period_start).format("MMM D")} -{" "}
                      {moment(payroll.pay_period_end).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {moment(payroll.pay_date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${payroll.gross_pay?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ${payroll.total_deductions?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${payroll.net_pay?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payroll.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPayslip(payroll)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payroll.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updatePayrollMutation.mutate({
                                id: payroll.id,
                                data: { status: "pending" },
                              })
                            }
                          >
                            Submit
                          </Button>
                        )}
                        {payroll.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayroll(payroll)}
                          >
                            Approve
                          </Button>
                        )}
                        {payroll.status === "approved" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              updatePayrollMutation.mutate({
                                id: payroll.id,
                                data: { status: "paid" },
                              })
                            }
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrollByDepartment.map((dept, idx) => {
                  const colors = ["bg-indigo-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];
                  const colorClass = colors[idx % colors.length];
                  
                  return (
                    <div key={dept.department} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dept.department}</p>
                          <p className="text-sm text-muted-foreground">{dept.count} employees</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${dept.totalNet.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Net Pay</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`${colorClass} h-2 rounded-full`}
                          style={{ width: `${(dept.totalNet / totalNet) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {payrollByDepartment.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax & Deduction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">Federal Tax</span>
                  <span className="font-bold text-red-600">
                    ${filteredPayrolls.reduce((sum, p) => sum + (p.federal_tax || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">State Tax</span>
                  <span className="font-bold text-orange-600">
                    ${filteredPayrolls.reduce((sum, p) => sum + (p.state_tax || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Social Security</span>
                  <span className="font-bold text-blue-600">
                    ${filteredPayrolls.reduce((sum, p) => sum + (p.social_security || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Medicare</span>
                  <span className="font-bold text-purple-600">
                    ${filteredPayrolls.reduce((sum, p) => sum + (p.medicare || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Health Insurance</span>
                  <span className="font-bold text-green-600">
                    ${filteredPayrolls.reduce((sum, p) => sum + (p.health_insurance || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average Net Pay</p>
                <p className="text-2xl font-bold text-green-600">
                  ${filteredPayrolls.length > 0 
                    ? (totalNet / filteredPayrolls.length).toFixed(0).toLocaleString()
                    : 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average Deductions</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${filteredPayrolls.length > 0
                    ? (totalDeductions / filteredPayrolls.length).toFixed(0).toLocaleString()
                    : 0}
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-bold text-lg">{selectedPayroll.employee_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPayroll.employee_email}</p>
                <p className="text-sm text-muted-foreground">{selectedPayroll.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pay Period</p>
                  <p className="font-medium">
                    {moment(selectedPayroll.pay_period_start).format("MMM D")} - {moment(selectedPayroll.pay_period_end).format("MMM D, YYYY")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pay Date</p>
                  <p className="font-medium">{moment(selectedPayroll.pay_date).format("MMM D, YYYY")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Earnings</h4>
                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Base Salary</span>
                    <span className="font-medium">${selectedPayroll.base_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hours Worked</span>
                    <span className="font-medium">{selectedPayroll.hours_worked} hrs</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Gross Pay</span>
                    <span className="font-bold text-green-600">${selectedPayroll.gross_pay?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Deductions</h4>
                <div className="bg-red-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Federal Tax</span>
                    <span className="font-medium">${selectedPayroll.federal_tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">State Tax</span>
                    <span className="font-medium">${selectedPayroll.state_tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Social Security</span>
                    <span className="font-medium">${selectedPayroll.social_security?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Medicare</span>
                    <span className="font-medium">${selectedPayroll.medicare?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Health Insurance</span>
                    <span className="font-medium">${selectedPayroll.health_insurance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total Deductions</span>
                    <span className="font-bold text-red-600">${selectedPayroll.total_deductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-lg text-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Pay</span>
                  <span className="text-3xl font-bold">${selectedPayroll.net_pay?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayslipDialogOpen(false)}>
              Close
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}