import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format, parseISO, isPast } from "date-fns";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Upload,
  Users,
  Video,
  FileText,
  Link as LinkIcon,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BadgeCard } from "@/components/gamification/BadgeDisplay";
import Leaderboard from "@/components/gamification/Leaderboard";
import MaterialUploader from "@/components/training/MaterialUploader";
import BulkAssignDialog from "@/components/training/BulkAssignDialog";
import TrainingRequestForm from "@/components/training/TrainingRequestForm";

const DEPARTMENTS = ["HR", "Finance", "Sales", "Legal", "IT", "Marketing", "Operations", "Executive"];

export default function Training() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["trainingCourses"],
    queryFn: () => base44.entities.TrainingCourse.list("-created_date"),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list("-created_date"),
  });

  const { data: trainingRequests = [] } = useQuery({
    queryKey: ["trainingRequests"],
    queryFn: () => base44.entities.TrainingRequest.list("-created_date"),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", currentEmployee?.id],
    queryFn: () => currentEmployee ? base44.entities.Achievement.filter({ employee_id: currentEmployee.id }) : [],
    enabled: !!currentEmployee,
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingCourse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingCourses"] });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      setMaterials([]);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingCourse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingCourses"] });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      setMaterials([]);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingCourse.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainingCourses"] }),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingAssignments"] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingAssignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingAssignments"] });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingRequests"] });
      setIsRequestDialogOpen(false);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingRequests"] });
    },
  });

  const createAchievementMutation = useMutation({
    mutationFn: (data) => base44.entities.Achievement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  const checkAndAwardBadge = async (badgeType, badgeName, description, points) => {
    const existing = achievements.find(a => a.badge_type === badgeType);
    if (!existing && currentEmployee) {
      createAchievementMutation.mutate({
        employee_id: currentEmployee.id,
        employee_name: currentEmployee.full_name,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_description: description,
        points_earned: points,
        earned_date: new Date().toISOString().split('T')[0],
      });
    }
  };



  const handleSubmitCourse = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const targetDepts = formData.get("target_departments");
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      duration_hours: parseFloat(formData.get("duration_hours")) || 0,
      is_mandatory: formData.get("is_mandatory") === "true",
      status: formData.get("status"),
      target_departments: targetDepts === "all" ? [] : [targetDepts],
      materials: materials.filter(m => m.title && m.file_url),
      created_by: currentEmployee?.id,
      created_by_name: currentEmployee?.full_name,
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data });
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const handleBulkAssign = (employeeIds, dueDate) => {
    employeeIds.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        createAssignmentMutation.mutate({
          course_id: selectedCourse.id,
          course_title: selectedCourse.title,
          employee_id: emp.id,
          employee_name: emp.full_name,
          assigned_by: currentEmployee?.id,
          assigned_by_name: currentEmployee?.full_name,
          assigned_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: "not_started",
          progress: 0,
        });

        createNotificationMutation.mutate({
          recipient_id: emp.id,
          recipient_name: emp.full_name,
          type: "task_assigned",
          title: "New Training Assigned",
          message: `You have been assigned: ${selectedCourse.title}`,
          link: "/Training",
          priority: selectedCourse.is_mandatory ? "high" : "normal",
        });
      }
    });

    setIsAssignDialogOpen(false);
    setSelectedCourse(null);
  };

  const handleRequestTraining = (data) => {
    createRequestMutation.mutate(data);
    createNotificationMutation.mutate({
      recipient_id: "admin",
      type: "info",
      title: "New Training Request",
      message: `${data.employee_name} requested: ${data.topic}`,
      link: "/Training",
      priority: data.priority === "urgent" ? "high" : "normal",
    });
  };

  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || currentEmployee?.department === "HR";

  const myAssignments = currentEmployee
    ? assignments.filter(a => a.employee_id === currentEmployee.id)
    : [];

  const activeCourses = courses.filter(c => c.status === "active");

  const materialIcons = {
    video: Video,
    document: FileText,
    link: LinkIcon,
    quiz: ClipboardList,
  };

  return (
    <div>
      <PageHeader
        title="Training & Development"
        subtitle="Manage and track employee training programs"
        action={canManage ? () => {
          setEditingCourse(null);
          setMaterials([]);
          setIsCourseDialogOpen(true);
        } : undefined}
        actionLabel={canManage ? "Create Course" : undefined}
      />

      <Tabs defaultValue={canManage ? "courses" : "my-training"} className="w-full">
        <TabsList>
          {!canManage && <TabsTrigger value="my-training">My Training</TabsTrigger>}
          <TabsTrigger value="courses">All Courses</TabsTrigger>
          {canManage && <TabsTrigger value="assignments">Assignments</TabsTrigger>}
          {canManage && <TabsTrigger value="requests">Requests</TabsTrigger>}
        </TabsList>

        {/* My Training Tab */}
        {!canManage && (
          <TabsContent value="my-training" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(true)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request New Training
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-500 mb-2">Assigned</p>
                  <p className="text-3xl font-bold text-indigo-600">{myAssignments.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-500 mb-2">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {myAssignments.filter(a => a.status === "in_progress").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-500 mb-2">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {myAssignments.filter(a => a.status === "completed").length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {myAssignments.length > 0 ? (
                myAssignments.map((assignment) => {
                  const course = courses.find(c => c.id === assignment.course_id);
                  const isOverdue = assignment.due_date && isPast(parseISO(assignment.due_date)) && assignment.status !== "completed";
                  
                  return (
                    <Card key={assignment.id} className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">{assignment.course_title}</h3>
                              <StatusBadge status={assignment.status} />
                              {isOverdue && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {course && (
                              <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              {assignment.due_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Due: {format(parseISO(assignment.due_date), "MMM d, yyyy")}
                                </span>
                              )}
                              {course?.duration_hours && (
                                <span>{course.duration_hours} hours</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-semibold text-indigo-600">{assignment.progress || 0}%</span>
                          </div>
                          <Progress value={assignment.progress || 0} className="h-2" />
                        </div>
                        {assignment.status !== "completed" && (
                          <Button
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                            onClick={async () => {
                              if (assignment.status === "not_started") {
                                updateAssignmentMutation.mutate({
                                  id: assignment.id,
                                  data: { status: "in_progress", progress: 10 }
                                });
                                checkAndAwardBadge("training_starter", "Training Starter", "Started first course", 20);
                              } else {
                                const newProgress = Math.min((assignment.progress || 0) + 25, 100);
                                const newStatus = newProgress === 100 ? "completed" : "in_progress";
                                updateAssignmentMutation.mutate({
                                  id: assignment.id,
                                  data: { 
                                    progress: newProgress, 
                                    status: newStatus,
                                    completed_date: newProgress === 100 ? new Date().toISOString().split('T')[0] : undefined
                                  }
                                });
                                if (newProgress === 100) {
                                  const completedCount = myAssignments.filter(a => a.status === "completed").length + 1;
                                  if (completedCount >= 5) {
                                    checkAndAwardBadge("training_champion", "Training Champion", "Completed 5+ courses", 100);
                                  }
                                  if (assignment.due_date && new Date() < new Date(assignment.due_date)) {
                                    checkAndAwardBadge("quick_learner", "Quick Learner", "Completed ahead of deadline", 30);
                                  }
                                }
                              }
                            }}
                          >
                            {assignment.status === "not_started" ? "Start Course" : "Continue"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="No training assigned"
                  description="You have no training courses assigned at this time"
                />
              )}
            </div>

            {/* Quick Badge View */}
            {!canManage && achievements.length > 0 && (
              <Card className="border-0 shadow-sm mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <CardTitle>Recent Badges</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {achievements.slice(0, 4).map((achievement) => (
                      <BadgeCard
                        key={achievement.id}
                        badgeType={achievement.badge_type}
                        earned={true}
                        earnedDate={achievement.earned_date}
                        compact={true}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* All Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-slate-200 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeCourses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No courses available"
              description={canManage ? "Create your first training course" : "No courses at this time"}
              action={canManage ? () => setIsCourseDialogOpen(true) : undefined}
              actionLabel={canManage ? "Create Course" : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCourses.map((course) => {
                const MaterialIcon = materialIcons[course.materials?.[0]?.type] || FileText;
                const assignmentCount = assignments.filter(a => a.course_id === course.id).length;
                
                return (
                  <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                            {course.is_mandatory && (
                              <Badge className="bg-red-100 text-red-700 border-red-200">
                                Mandatory
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <Badge variant="outline" className="capitalize">
                              {course.category?.replace(/_/g, " ")}
                            </Badge>
                            {course.duration_hours && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.duration_hours}h
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MaterialIcon className="w-4 h-4" />
                              {course.materials?.length || 0} materials
                            </span>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCourse(course);
                                setMaterials(course.materials || []);
                                setIsCourseDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => deleteCourseMutation.mutate(course.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm text-slate-500">
                            {assignmentCount} {assignmentCount === 1 ? "assignment" : "assignments"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Assign
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab (Admin/HR only) */}
        {canManage && (
          <TabsContent value="assignments" className="space-y-6">
            {/* Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Leaderboard 
                data={Object.entries(
                  assignments
                    .filter(a => a.status === "completed")
                    .reduce((acc, a) => {
                      if (!acc[a.employee_id]) {
                        acc[a.employee_id] = {
                          employee_id: a.employee_id,
                          employee_name: a.employee_name,
                          completedTraining: 0,
                        };
                      }
                      acc[a.employee_id].completedTraining++;
                      return acc;
                    }, {})
                ).map(([id, data]) => data)}
                title="Top Training Completers"
                metric="completedTraining"
              />
              <Leaderboard 
                data={Object.entries(
                  assignments
                    .reduce((acc, a) => {
                      if (!acc[a.employee_id]) {
                        acc[a.employee_id] = {
                          employee_id: a.employee_id,
                          employee_name: a.employee_name,
                          avgProgress: 0,
                          count: 0,
                          total: 0,
                        };
                      }
                      acc[a.employee_id].total += a.progress || 0;
                      acc[a.employee_id].count++;
                      acc[a.employee_id].avgProgress = Math.round(acc[a.employee_id].total / acc[a.employee_id].count);
                      return acc;
                    }, {})
                ).map(([id, data]) => data)}
                title="Average Progress Leaders"
                metric="avgProgress"
              />
            </div>

            {/* Assignments List */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>All Training Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{assignment.employee_name}</p>
                            <p className="text-sm text-slate-600">{assignment.course_title}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <StatusBadge status={assignment.status} />
                              {assignment.due_date && (
                                <span className="text-xs text-slate-500">
                                  Due: {format(parseISO(assignment.due_date), "MMM d, yyyy")}
                                </span>
                              )}
                              <span className="text-xs text-slate-500">{assignment.progress}% complete</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No assignments"
                    description="No training has been assigned yet"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Requests Tab (Admin/HR only) */}
        {canManage && (
          <TabsContent value="requests" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Training Requests from Employees</CardTitle>
              </CardHeader>
              <CardContent>
                {trainingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {trainingRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{request.topic}</h4>
                              <StatusBadge status={request.status} />
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{request.description}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-slate-500">Requested by: {request.employee_name}</span>
                              <Badge variant="outline" className="capitalize">
                                {request.category?.replace(/_/g, " ")}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {request.priority} priority
                              </Badge>
                            </div>
                          </div>
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => {
                                  updateRequestMutation.mutate({
                                    id: request.id,
                                    data: {
                                      status: "approved",
                                      reviewed_by: currentEmployee?.id,
                                      reviewed_by_name: currentEmployee?.full_name,
                                      reviewed_date: new Date().toISOString().split('T')[0]
                                    }
                                  });
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) {
                                    updateRequestMutation.mutate({
                                      id: request.id,
                                      data: {
                                        status: "rejected",
                                        reviewed_by: currentEmployee?.id,
                                        reviewed_by_name: currentEmployee?.full_name,
                                        reviewed_date: new Date().toISOString().split('T')[0],
                                        rejection_reason: reason
                                      }
                                    });
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardList}
                    title="No training requests"
                    description="Employees can request new training topics"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Create Training Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingCourse?.title}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCourse?.description}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingCourse?.category || "other"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="soft_skills">Soft Skills</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duration (hours)</Label>
                <Input
                  id="duration_hours"
                  name="duration_hours"
                  type="number"
                  step="0.5"
                  defaultValue={editingCourse?.duration_hours}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_departments">Target Department</Label>
                <Select name="target_departments" defaultValue={
                  editingCourse?.target_departments?.length > 0 
                    ? editingCourse.target_departments[0] 
                    : "all"
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_mandatory">Mandatory?</Label>
                <Select name="is_mandatory" defaultValue={String(editingCourse?.is_mandatory || false)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editingCourse?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <MaterialUploader
                materials={materials}
                onMaterialsChange={setMaterials}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsCourseDialogOpen(false);
                setEditingCourse(null);
                setMaterials([]);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingCourse ? "Update" : "Create"} Course
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Course Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Training Course</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <BulkAssignDialog
              course={selectedCourse}
              employees={employees}
              onSubmit={handleBulkAssign}
              onCancel={() => {
                setIsAssignDialogOpen(false);
                setSelectedCourse(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Request Training Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request New Training</DialogTitle>
          </DialogHeader>
          <TrainingRequestForm
            currentEmployee={currentEmployee}
            onSubmit={handleRequestTraining}
            onCancel={() => setIsRequestDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}