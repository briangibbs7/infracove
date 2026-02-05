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
import { Plus, DollarSign, Calendar, Users, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";

export default function Payroll() {
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [filter, setFilter] = useState("all");
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
    if (filter === "all") return true;
    return p.status === filter;
  });

  const totalGross = filteredPayrolls.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
  const pendingCount = payrolls.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Manage employee compensation and payments"
        action={{
          label: "Run Payroll",
          icon: Plus,
          onClick: handleRunPayroll,
        }}
      />

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
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {employees.filter((e) => e.status === "active").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payroll Records</CardTitle>
            <div className="flex gap-2">
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
    </div>
  );
}