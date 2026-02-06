import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  AlertTriangle,
  Bell,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Monitor,
  Plus,
  Search,
  Filter,
  Users,
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/PageHeader";

export default function Compliance() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: programs = [] } = useQuery({
    queryKey: ["compliancePrograms"],
    queryFn: () => base44.entities.ComplianceProgram.list(),
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["complianceViolations"],
    queryFn: () => base44.entities.ComplianceViolation.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["complianceAlerts"],
    queryFn: () => base44.entities.ComplianceAlert.list(),
  });

  const { data: audits = [] } = useQuery({
    queryKey: ["complianceAudits"],
    queryFn: () => base44.entities.ComplianceAudit.list(),
  });

  const { data: techPlans = [] } = useQuery({
    queryKey: ["technologyControlPlans"],
    queryFn: () => base44.entities.TechnologyControlPlan.list(),
  });

  const { data: personnel = [] } = useQuery({
    queryKey: ["compliancePersonnel"],
    queryFn: () => base44.entities.CompliancePersonnel.list(),
  });

  const { data: deemedExports = [] } = useQuery({
    queryKey: ["deemedExports"],
    queryFn: () => base44.entities.DeemedExport.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createProgramMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceProgram.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliancePrograms"] });
      setDialogOpen(false);
      setFormData({});
    },
  });

  const createViolationMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceViolation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceViolations"] });
      setDialogOpen(false);
      setFormData({});
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceAlerts"] });
      setDialogOpen(false);
      setFormData({});
    },
  });

  const openDialog = (type) => {
    setDialogType(type);
    setFormData({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      created_by: user?.id,
      created_by_name: user?.full_name,
    };

    if (dialogType === "program") {
      createProgramMutation.mutate(data);
    } else if (dialogType === "violation") {
      createViolationMutation.mutate(data);
    } else if (dialogType === "alert") {
      createAlertMutation.mutate(data);
    }
  };

  const activePrograms = programs.filter(p => p.status === "active");
  const openViolations = violations.filter(v => v.status !== "resolved");
  const openAlerts = alerts.filter(a => a.status === "open");
  const upcomingAudits = audits.filter(a => a.status === "scheduled" || a.status === "in_progress");

  const getSeverityColor = (severity) => {
    const colors = {
      minor: "bg-blue-100 text-blue-800",
      moderate: "bg-yellow-100 text-yellow-800",
      major: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[severity] || "bg-slate-100 text-slate-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      open: "bg-blue-100 text-blue-800",
      resolved: "bg-slate-100 text-slate-800",
      under_investigation: "bg-yellow-100 text-yellow-800",
      escalated: "bg-red-100 text-red-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Management"
        subtitle="Export Control & Regulatory Compliance"
        action={{
          label: "New Program",
          onClick: () => openDialog("program"),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Programs</CardTitle>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrograms.length}</div>
            <p className="text-xs text-slate-500">Compliance programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Open Violations</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openViolations.length}</div>
            <p className="text-xs text-slate-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
            <Bell className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openAlerts.length}</div>
            <p className="text-xs text-slate-500">Pending action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Audits</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAudits.length}</div>
            <p className="text-xs text-slate-500">Scheduled/In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="deemed-exports">Deemed Exports</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="tech-control">Tech Control Plans</TabsTrigger>
        </TabsList>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search personnel..."
              className="max-w-sm"
            />
          </div>

          <div className="space-y-3">
            {personnel.map((person) => (
              <Card key={person.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{person.employee_name}</h3>
                          <p className="text-sm text-slate-500">{person.employee_email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Citizenship:</span>
                          <p className="font-medium">{person.citizenship || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Clearance:</span>
                          <Badge className={getSeverityColor(person.clearance_level === "top_secret" ? "critical" : person.clearance_level === "secret" ? "high" : "low")}>
                            {person.clearance_level}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-500">Training:</span>
                          <Badge className={person.export_control_training ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {person.export_control_training ? "Completed" : "Required"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-slate-500">Access Level:</span>
                          <Badge className={person.access_level === "full" ? "bg-green-100 text-green-800" : person.access_level === "limited" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                            {person.access_level}
                          </Badge>
                        </div>
                      </div>
                      {person.visa_type && (
                        <div className="mt-3 text-sm">
                          <span className="text-slate-500">Visa: </span>
                          <span className="font-medium">{person.visa_type}</span>
                          {person.visa_expiry && (
                            <span className="text-slate-500"> (Expires: {new Date(person.visa_expiry).toLocaleDateString()})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {personnel.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  No personnel records found. Add employees to compliance tracking.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Deemed Exports Tab */}
        <TabsContent value="deemed-exports" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search deemed exports..."
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {deemedExports.map((export_record) => (
              <Card key={export_record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-base">{export_record.employee_name}</CardTitle>
                      </div>
                      <CardDescription>{export_record.technology_description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(export_record.status)}>
                      {export_record.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Country:</span>
                      <p className="font-medium">{export_record.foreign_national_country}</p>
                    </div>
                    {export_record.eccn_classification && (
                      <div>
                        <span className="text-slate-500">ECCN:</span>
                        <p className="font-medium">{export_record.eccn_classification}</p>
                      </div>
                    )}
                    {export_record.itar_category && (
                      <div>
                        <span className="text-slate-500">ITAR Category:</span>
                        <p className="font-medium">{export_record.itar_category}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">License Type:</span>
                      <p className="font-medium capitalize">{export_record.license_type?.replace(/_/g, " ")}</p>
                    </div>
                    {export_record.release_date && (
                      <div>
                        <span className="text-slate-500">Release Date:</span>
                        <p className="font-medium">{new Date(export_record.release_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Risk:</span>
                      <Badge className={getSeverityColor(export_record.risk_assessment)}>
                        {export_record.risk_assessment}
                      </Badge>
                    </div>
                  </div>
                  {export_record.project_name && (
                    <div className="mt-3 text-sm">
                      <span className="text-slate-500">Project: </span>
                      <span className="font-medium">{export_record.project_name}</span>
                    </div>
                  )}
                  {export_record.approved_by_name && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-500">Approved by: </span>
                      <span className="font-medium">{export_record.approved_by_name}</span>
                      {export_record.approval_date && (
                        <span className="text-slate-500"> on {new Date(export_record.approval_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {deemedExports.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  No deemed export records found.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => openDialog("program")}>
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{program.program_name}</CardTitle>
                      <CardDescription>{program.regulatory_framework}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(program.status)}>
                      {program.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Owner:</span>
                      <span className="font-medium">{program.owner_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Risk Level:</span>
                      <Badge className={getSeverityColor(program.risk_level)}>
                        {program.risk_level}
                      </Badge>
                    </div>
                    {program.compliance_score && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Compliance Score:</span>
                        <span className="font-medium">{program.compliance_score}%</span>
                      </div>
                    )}
                    {program.next_review_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Next Review:</span>
                        <span className="font-medium">
                          {new Date(program.next_review_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search violations..."
              className="max-w-sm"
            />
            <Button onClick={() => openDialog("violation")}>
              <Plus className="w-4 h-4 mr-2" />
              Report Violation
            </Button>
          </div>

          <div className="space-y-4">
            {violations.map((violation) => (
              <Card key={violation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {violation.title}
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{violation.program_name}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(violation.status)}>
                      {violation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">{violation.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Reported by:</span>
                      <p className="font-medium">{violation.reported_by_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Reported:</span>
                      <p className="font-medium">
                        {new Date(violation.reported_date).toLocaleDateString()}
                      </p>
                    </div>
                    {violation.employee_name && (
                      <div>
                        <span className="text-slate-500">Employee Involved:</span>
                        <p className="font-medium">{violation.employee_name}</p>
                      </div>
                    )}
                    {violation.financial_impact && (
                      <div>
                        <span className="text-slate-500">Financial Impact:</span>
                        <p className="font-medium text-red-600">
                          ${violation.financial_impact.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search alerts..."
              className="max-w-sm"
            />
            <Button onClick={() => openDialog("alert")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={getSeverityColor(alert.priority)}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{alert.description}</p>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>Program: {alert.program_name}</span>
                        {alert.due_date && (
                          <span>Due: {new Date(alert.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audits Tab */}
        <TabsContent value="audits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{audit.audit_name}</CardTitle>
                      <CardDescription>{audit.auditor_organization}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(audit.status)}>
                      {audit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium capitalize">{audit.audit_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Program:</span>
                      <span className="font-medium">{audit.program_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Start Date:</span>
                      <span className="font-medium">
                        {new Date(audit.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {audit.overall_rating && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rating:</span>
                        <Badge className="capitalize">{audit.overall_rating}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Technology Control Plans Tab */}
        <TabsContent value="tech-control" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {techPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.plan_name}</CardTitle>
                      <CardDescription>{plan.classification}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">{plan.technology_description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Responsible:</span>
                      <span className="font-medium">{plan.responsible_person_name}</span>
                    </div>
                    {plan.effective_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Effective:</span>
                        <span className="font-medium">
                          {new Date(plan.effective_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {plan.authorized_personnel?.length > 0 && (
                      <div>
                        <span className="text-slate-600">Authorized Personnel:</span>
                        <p className="font-medium">{plan.authorized_personnel.length} people</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "program" && "New Compliance Program"}
              {dialogType === "violation" && "Report Violation"}
              {dialogType === "alert" && "Create Alert"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new {dialogType}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogType === "program" && (
              <>
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={formData.program_name || ""}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Program Type</Label>
                  <Select
                    value={formData.program_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, program_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export_control">Export Control</SelectItem>
                      <SelectItem value="data_privacy">Data Privacy</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Regulatory Framework</Label>
                  <Input
                    placeholder="e.g., ITAR, EAR, GDPR"
                    value={formData.regulatory_framework || ""}
                    onChange={(e) => setFormData({ ...formData, regulatory_framework: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}

            {dialogType === "violation" && (
              <>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Violation Type</Label>
                  <Select
                    value={formData.violation_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, violation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export_control">Export Control</SelectItem>
                      <SelectItem value="data_breach">Data Breach</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr_policy">HR Policy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select
                    value={formData.severity || ""}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}

            {dialogType === "alert" && (
              <>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Alert Type</Label>
                  <Select
                    value={formData.alert_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, alert_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="violation">Violation</SelectItem>
                      <SelectItem value="review_due">Review Due</SelectItem>
                      <SelectItem value="training_required">Training Required</SelectItem>
                      <SelectItem value="regulatory_change">Regulatory Change</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority || ""}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}