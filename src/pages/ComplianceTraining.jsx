import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import PageHeader from "@/components/ui/PageHeader";
import {
  BookOpen,
  Plus,
  Upload,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3
} from "lucide-react";

export default function ComplianceTraining() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    training_type: "export_control",
    content: "",
    duration_minutes: 30,
    validity_months: 12,
    passing_score: 80,
    status: "active"
  });
  const [assignmentData, setAssignmentData] = useState({
    employee_ids: [],
    due_date: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: trainings = [] } = useQuery({
    queryKey: ["complianceTrainings"],
    queryFn: () => base44.entities.ComplianceTraining.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["complianceTrainingAssignments"],
    queryFn: () => base44.entities.ComplianceTrainingAssignment.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createTrainingMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceTraining.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceTrainings"] });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        training_type: "export_control",
        content: "",
        duration_minutes: 30,
        validity_months: 12,
        passing_score: 80,
        status: "active"
      });
    },
  });

  const assignTrainingMutation = useMutation({
    mutationFn: async (data) => {
      const assignments = data.employee_ids.map(emp_id => {
        const emp = employees.find(e => e.id === emp_id);
        return {
          training_id: data.training_id,
          training_title: data.training_title,
          employee_id: emp_id,
          employee_name: emp?.full_name,
          employee_email: emp?.email,
          assigned_by: user?.id,
          assigned_by_name: user?.full_name,
          assigned_date: new Date().toISOString().split('T')[0],
          due_date: data.due_date,
          status: "assigned"
        };
      });
      
      return base44.entities.ComplianceTrainingAssignment.bulkCreate(assignments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceTrainingAssignments"] });
      setAssignDialogOpen(false);
      setSelectedTraining(null);
      setAssignmentData({ employee_ids: [], due_date: "" });
    },
  });

  const handleCreateTraining = () => {
    createTrainingMutation.mutate({
      ...formData,
      created_by: user?.id,
      created_by_name: user?.full_name
    });
  };

  const handleAssign = () => {
    assignTrainingMutation.mutate({
      training_id: selectedTraining.id,
      training_title: selectedTraining.title,
      ...assignmentData
    });
  };

  const openAssignDialog = (training) => {
    setSelectedTraining(training);
    setAssignDialogOpen(true);
  };

  const activeTrainings = trainings.filter(t => t.status === "active");
  const completedAssignments = assignments.filter(a => a.status === "completed");
  const overdueAssignments = assignments.filter(a => a.status === "overdue" || (a.status === "assigned" && new Date(a.due_date) < new Date()));
  
  const completionRate = assignments.length > 0 
    ? Math.round((completedAssignments.length / assignments.length) * 100) 
    : 0;

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Training"
        subtitle="Manage and track compliance training programs"
        actionLabel={isAdmin ? "Create Training" : undefined}
        actionIcon={isAdmin ? Plus : undefined}
        onActionClick={isAdmin ? () => setDialogOpen(true) : undefined}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Trainings</CardTitle>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrainings.length}</div>
            <p className="text-xs text-slate-500">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-slate-500">{completedAssignments.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueAssignments.length}</div>
            <p className="text-xs text-slate-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Assignments</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-slate-500">All assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue={isAdmin ? "trainings" : "my-trainings"} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="trainings">Training Catalog</TabsTrigger>}
          <TabsTrigger value="my-trainings">My Trainings</TabsTrigger>
          {isAdmin && <TabsTrigger value="assignments">All Assignments</TabsTrigger>}
          {isAdmin && <TabsTrigger value="reports">Reports</TabsTrigger>}
        </TabsList>

        {/* Training Catalog (Admin) */}
        {isAdmin && (
          <TabsContent value="trainings" className="space-y-4">
            <div className="flex justify-between items-center">
              <Input placeholder="Search trainings..." className="max-w-sm" />
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Training
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainings.map((training) => {
                const trainingAssignments = assignments.filter(a => a.training_id === training.id);
                const completedCount = trainingAssignments.filter(a => a.status === "completed").length;
                const completionRate = trainingAssignments.length > 0 
                  ? Math.round((completedCount / trainingAssignments.length) * 100) 
                  : 0;

                return (
                  <Card key={training.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{training.title}</CardTitle>
                              <CardDescription className="text-sm">{training.description}</CardDescription>
                            </div>
                          </div>
                        </div>
                        <Badge className={training.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                          {training.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-1 text-slate-600 mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">Duration</span>
                          </div>
                          <p className="font-medium text-sm">{training.duration_minutes} min</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-1 text-slate-600 mb-1">
                            <FileText className="w-3 h-3" />
                            <span className="text-xs">Validity</span>
                          </div>
                          <p className="font-medium text-sm">{training.validity_months} months</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-1 text-slate-600 mb-1">
                            <BarChart3 className="w-3 h-3" />
                            <span className="text-xs">Pass Score</span>
                          </div>
                          <p className="font-medium text-sm">{training.passing_score}%</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-1 text-blue-600 mb-1">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">Assigned</span>
                          </div>
                          <p className="font-medium text-sm text-blue-700">{trainingAssignments.length}</p>
                        </div>
                      </div>

                      <Badge variant="outline" className="w-full mb-3 capitalize">
                        {training.training_type.replace('_', ' ')}
                      </Badge>

                      {trainingAssignments.length > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Completion Rate</span>
                            <span className="font-medium">{completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all" 
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Button 
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => openAssignDialog(training)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Assign to Employees
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* My Trainings */}
        <TabsContent value="my-trainings" className="space-y-4">
          <div className="space-y-4">
            {assignments
              .filter(a => a.employee_email === user?.email)
              .map((assignment) => {
                const training = trainings.find(t => t.id === assignment.training_id);
                const isOverdue = assignment.status === "assigned" && new Date(assignment.due_date) < new Date();
                const daysUntilDue = assignment.due_date ? Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const daysUntilExpiry = assignment.expiry_date ? Math.ceil((new Date(assignment.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                
                return (
                  <Card key={assignment.id} className={`border-l-4 ${
                    assignment.status === "completed" ? "border-l-green-500 bg-green-50/30" :
                    assignment.status === "failed" ? "border-l-red-500 bg-red-50/30" :
                    isOverdue ? "border-l-red-500 bg-red-50/30" :
                    "border-l-blue-500"
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              assignment.status === "completed" ? "bg-green-100" :
                              assignment.status === "failed" ? "bg-red-100" :
                              isOverdue ? "bg-red-100" :
                              "bg-blue-100"
                            }`}>
                              {assignment.status === "completed" ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : assignment.status === "failed" ? (
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              ) : (
                                <BookOpen className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{assignment.training_title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={
                                  assignment.status === "completed" ? "bg-green-100 text-green-800" :
                                  assignment.status === "failed" ? "bg-red-100 text-red-800" :
                                  isOverdue ? "bg-red-100 text-red-800" :
                                  assignment.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-blue-100 text-blue-800"
                                }>
                                  {isOverdue ? "Overdue" : assignment.status.replace('_', ' ')}
                                </Badge>
                                {training && (
                                  <Badge variant="outline" className="capitalize">
                                    {training.training_type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                            {assignment.due_date && (
                              <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-50" : "bg-slate-50"}`}>
                                <div className="flex items-center gap-1 text-slate-600 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">Due Date</span>
                                </div>
                                <p className={`font-medium ${isOverdue ? "text-red-700" : ""}`}>
                                  {new Date(assignment.due_date).toLocaleDateString()}
                                </p>
                                {daysUntilDue !== null && !isOverdue && (
                                  <p className="text-xs text-slate-500">{daysUntilDue} days left</p>
                                )}
                              </div>
                            )}
                            
                            {training?.duration_minutes && (
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-1 text-slate-600 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">Duration</span>
                                </div>
                                <p className="font-medium">{training.duration_minutes} min</p>
                              </div>
                            )}

                            {assignment.quiz_score !== undefined && (
                              <div className={`p-2 rounded-lg ${
                                assignment.quiz_score >= (training?.passing_score || 80) ? "bg-green-50" : "bg-red-50"
                              }`}>
                                <div className="flex items-center gap-1 text-slate-600 mb-1">
                                  <BarChart3 className="w-3 h-3" />
                                  <span className="text-xs">Score</span>
                                </div>
                                <p className={`font-medium ${
                                  assignment.quiz_score >= (training?.passing_score || 80) ? "text-green-700" : "text-red-700"
                                }`}>
                                  {assignment.quiz_score}%
                                </p>
                              </div>
                            )}

                            {assignment.attempts > 0 && (
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-1 text-slate-600 mb-1">
                                  <FileText className="w-3 h-3" />
                                  <span className="text-xs">Attempts</span>
                                </div>
                                <p className="font-medium">{assignment.attempts}</p>
                              </div>
                            )}
                          </div>

                          {assignment.status === "completed" && assignment.expiry_date && (
                            <div className={`p-3 rounded-lg ${isExpiringSoon ? "bg-amber-50 border border-amber-200" : "bg-slate-50"}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-slate-700">Certification Status</p>
                                  <p className={`text-sm ${isExpiringSoon ? "text-amber-700" : "text-slate-500"}`}>
                                    {isExpiringSoon ? (
                                      <>
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        Expires in {daysUntilExpiry} days
                                      </>
                                    ) : (
                                      `Valid until ${new Date(assignment.expiry_date).toLocaleDateString()}`
                                    )}
                                  </p>
                                </div>
                                {isExpiringSoon && (
                                  <Badge className="bg-amber-100 text-amber-800">Renewal Required</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {assignment.completed_date && (
                            <p className="text-xs text-slate-500 mt-2">
                              Completed on {new Date(assignment.completed_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        {assignment.status !== "completed" && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            {assignment.status === "in_progress" ? "Continue" : "Start Training"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {assignments.filter(a => a.employee_email === user?.email).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No training assignments yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* All Assignments (Admin) */}
        {isAdmin && (
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <Input placeholder="Search by employee or training..." className="max-w-sm" />
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => {
                const training = trainings.find(t => t.id === assignment.training_id);
                const isOverdue = assignment.status === "assigned" && new Date(assignment.due_date) < new Date();
                
                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          assignment.status === "completed" ? "bg-green-100" :
                          assignment.status === "failed" ? "bg-red-100" :
                          isOverdue ? "bg-red-100" :
                          "bg-blue-100"
                        }`}>
                          {assignment.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Users className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{assignment.employee_name}</h3>
                          <p className="text-sm text-slate-500 truncate">{assignment.training_title}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Status:</span>
                          <Badge className={
                            assignment.status === "completed" ? "bg-green-100 text-green-800" :
                            assignment.status === "failed" ? "bg-red-100 text-red-800" :
                            isOverdue ? "bg-red-100 text-red-800" :
                            "bg-blue-100 text-blue-800"
                          }>
                            {isOverdue ? "Overdue" : assignment.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {assignment.quiz_score !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Score:</span>
                            <span className={`font-medium ${
                              assignment.quiz_score >= (training?.passing_score || 80) ? "text-green-600" : "text-red-600"
                            }`}>
                              {assignment.quiz_score}%
                            </span>
                          </div>
                        )}

                        {assignment.due_date && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Due:</span>
                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {assignment.completed_date && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Completed:</span>
                            <span className="text-green-600">
                              {new Date(assignment.completed_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* Reports (Admin) */}
        {isAdmin && (
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Completion Report</CardTitle>
                <CardDescription>Summary of training completion across the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{completedAssignments.length}</p>
                      <p className="text-sm text-slate-600">Completed</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">
                        {assignments.filter(a => a.status === "in_progress" || a.status === "assigned").length}
                      </p>
                      <p className="text-sm text-slate-600">In Progress</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{overdueAssignments.length}</p>
                      <p className="text-sm text-slate-600">Overdue</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Training Breakdown by Type</h4>
                    {["export_control", "data_privacy", "safety", "security"].map(type => {
                      const typeAssignments = assignments.filter(a => {
                        const training = trainings.find(t => t.id === a.training_id);
                        return training?.training_type === type;
                      });
                      const completed = typeAssignments.filter(a => a.status === "completed").length;
                      const rate = typeAssignments.length > 0 ? Math.round((completed / typeAssignments.length) * 100) : 0;
                      
                      return (
                        <div key={type} className="mb-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-sm font-medium">{rate}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Training Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Compliance Training</DialogTitle>
            <DialogDescription>Add a new training program for employees</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.training_type}
                onValueChange={(value) => setFormData({ ...formData, training_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export_control">Export Control</SelectItem>
                  <SelectItem value="data_privacy">Data Privacy</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="ethics">Ethics</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Training Content</Label>
              <Textarea
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter training content, instructions, and key information..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Validity (months)</Label>
                <Input
                  type="number"
                  value={formData.validity_months}
                  onChange={(e) => setFormData({ ...formData, validity_months: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTraining}>Create Training</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Training Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Training</DialogTitle>
            <DialogDescription>
              Assign "{selectedTraining?.title}" to employees
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Employees</Label>
              <Select
                onValueChange={(value) => {
                  if (!assignmentData.employee_ids.includes(value)) {
                    setAssignmentData({
                      ...assignmentData,
                      employee_ids: [...assignmentData.employee_ids, value]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employees" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {assignmentData.employee_ids.map(id => {
                  const emp = employees.find(e => e.id === id);
                  return (
                    <Badge key={id} variant="outline">
                      {emp?.full_name}
                      <button
                        className="ml-2"
                        onClick={() => setAssignmentData({
                          ...assignmentData,
                          employee_ids: assignmentData.employee_ids.filter(eid => eid !== id)
                        })}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={assignmentData.due_date}
                onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignmentData.employee_ids.length === 0}>
              Assign Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}