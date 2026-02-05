import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import { Plus, Heart, Eye, Shield, Briefcase, Users, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Benefits() {
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: benefits = [], isLoading: benefitsLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: () => base44.entities.Benefit.filter({ is_active: true }),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["benefitEnrollments"],
    queryFn: () => base44.entities.BenefitEnrollment.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createBenefitMutation = useMutation({
    mutationFn: (data) => base44.entities.Benefit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit created successfully");
      setBenefitDialogOpen(false);
      setFormData({});
    },
    onError: () => toast.error("Failed to create benefit"),
  });

  const updateBenefitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Benefit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit updated successfully");
      setBenefitDialogOpen(false);
      setSelectedBenefit(null);
      setFormData({});
    },
    onError: () => toast.error("Failed to update benefit"),
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: (data) => base44.entities.BenefitEnrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefitEnrollments"] });
      toast.success("Enrollment created successfully");
      setEnrollmentDialogOpen(false);
      setSelectedEmployee(null);
      setFormData({});
    },
    onError: () => toast.error("Failed to create enrollment"),
  });

  const handleSaveBenefit = () => {
    if (selectedBenefit) {
      updateBenefitMutation.mutate({ id: selectedBenefit.id, data: formData });
    } else {
      createBenefitMutation.mutate(formData);
    }
  };

  const handleEnrollEmployee = () => {
    if (!selectedEmployee || !formData.benefit_id) {
      toast.error("Please select an employee and benefit");
      return;
    }

    const benefit = benefits.find((b) => b.id === formData.benefit_id);
    const employee = employees.find((e) => e.id === selectedEmployee);

    const enrollmentData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_email: employee.email,
      benefit_id: benefit.id,
      benefit_name: benefit.name,
      benefit_category: benefit.category,
      coverage_type: formData.coverage_type || "employee_only",
      enrollment_date: new Date().toISOString().split("T")[0],
      effective_date: formData.effective_date,
      status: "active",
      employee_contribution: benefit.employee_cost_monthly,
      employer_contribution: benefit.employer_cost_monthly,
    };

    createEnrollmentMutation.mutate(enrollmentData);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health_insurance: <Heart className="w-5 h-5" />,
      dental_insurance: <Shield className="w-5 h-5" />,
      vision_insurance: <Eye className="w-5 h-5" />,
      life_insurance: <Shield className="w-5 h-5" />,
      retirement_401k: <TrendingUp className="w-5 h-5" />,
      pto: <Briefcase className="w-5 h-5" />,
    };
    return icons[category] || <Briefcase className="w-5 h-5" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      health_insurance: "bg-red-100 text-red-700",
      dental_insurance: "bg-blue-100 text-blue-700",
      vision_insurance: "bg-purple-100 text-purple-700",
      life_insurance: "bg-green-100 text-green-700",
      retirement_401k: "bg-indigo-100 text-indigo-700",
      pto: "bg-amber-100 text-amber-700",
      wellness: "bg-pink-100 text-pink-700",
      education: "bg-cyan-100 text-cyan-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
  const totalBenefitsCost = enrollments
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + (e.employer_contribution || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benefits Management"
        subtitle="Manage company benefits and employee enrollments"
        action={{
          label: "Add Benefit",
          icon: Plus,
          onClick: () => {
            setSelectedBenefit(null);
            setFormData({});
            setBenefitDialogOpen(true);
          },
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{benefits.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{activeEnrollments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">
                ${totalBenefitsCost.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Participation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {employees.length > 0
                  ? Math.round((activeEnrollments / employees.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="benefits" className="w-full">
        <TabsList>
          <TabsTrigger value="benefits">Benefits Catalog</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="benefits" className="space-y-4">
          {benefitsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading benefits...
            </div>
          ) : benefits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No benefits available</p>
                <Button onClick={() => setBenefitDialogOpen(true)}>
                  Add First Benefit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <Card key={benefit.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-lg ${getCategoryColor(
                          benefit.category
                        )}`}
                      >
                        {getCategoryIcon(benefit.category)}
                      </div>
                      <Badge variant="outline">{benefit.category}</Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{benefit.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {benefit.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Employee Cost:</span>
                        <span className="font-medium">
                          ${benefit.employee_cost_monthly}/mo
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Employer Cost:</span>
                        <span className="font-medium">
                          ${benefit.employer_cost_monthly}/mo
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedBenefit(benefit);
                          setFormData(benefit);
                          setBenefitDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setFormData({ benefit_id: benefit.id });
                          setEnrollmentDialogOpen(true);
                        }}
                      >
                        Enroll Employee
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No enrollments yet
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{enrollment.employee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.benefit_name} • {enrollment.coverage_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${enrollment.employee_contribution}/mo
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            enrollment.status === "active"
                              ? "bg-green-50 text-green-700"
                              : ""
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Benefit Dialog */}
      <Dialog open={benefitDialogOpen} onOpenChange={setBenefitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBenefit ? "Edit Benefit" : "Add New Benefit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Benefit Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Premium Health Plan"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_insurance">Health Insurance</SelectItem>
                    <SelectItem value="dental_insurance">Dental Insurance</SelectItem>
                    <SelectItem value="vision_insurance">Vision Insurance</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance</SelectItem>
                    <SelectItem value="retirement_401k">401(k) Plan</SelectItem>
                    <SelectItem value="pto">Paid Time Off</SelectItem>
                    <SelectItem value="wellness">Wellness Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the benefit..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  value={formData.provider || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  placeholder="e.g., Blue Cross"
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage Type</Label>
                <Select
                  value={formData.coverage_type || "employee_only"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, coverage_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee_only">Employee Only</SelectItem>
                    <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                    <SelectItem value="employee_children">
                      Employee + Children
                    </SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Cost (Monthly)</Label>
                <Input
                  type="number"
                  value={formData.employee_cost_monthly || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee_cost_monthly: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Employer Cost (Monthly)</Label>
                <Input
                  type="number"
                  value={formData.employer_cost_monthly || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employer_cost_monthly: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBenefitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBenefit}
              disabled={
                !formData.name ||
                !formData.category ||
                createBenefitMutation.isPending ||
                updateBenefitMutation.isPending
              }
            >
              {selectedBenefit ? "Update" : "Create"} Benefit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Employee in Benefit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Employee *</Label>
              <Select
                value={selectedEmployee || ""}
                onValueChange={(value) => setSelectedEmployee(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === "active")
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Benefit *</Label>
              <Select
                value={formData.benefit_id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, benefit_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose benefit" />
                </SelectTrigger>
                <SelectContent>
                  {benefits.map((benefit) => (
                    <SelectItem key={benefit.id} value={benefit.id}>
                      {benefit.name} - ${benefit.employee_cost_monthly}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coverage Type</Label>
              <Select
                value={formData.coverage_type || "employee_only"}
                onValueChange={(value) =>
                  setFormData({ ...formData, coverage_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_only">Employee Only</SelectItem>
                  <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                  <SelectItem value="employee_children">
                    Employee + Children
                  </SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Input
                type="date"
                value={formData.effective_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, effective_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnrollmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnrollEmployee}
              disabled={
                !selectedEmployee ||
                !formData.benefit_id ||
                !formData.effective_date ||
                createEnrollmentMutation.isPending
              }
            >
              Enroll Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}