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
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { format, parseISO } from "date-fns";
import { 
  Target, 
  Star, 
  TrendingUp, 
  CheckCircle2,
  Plus,
  Edit,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Performance() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.PerformanceReview.list("-created_date"),
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.PerformanceGoal.list("-created_date"),
  });

  const { data: trainingAssignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list("-created_date"),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceReview.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setIsReviewDialogOpen(false);
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PerformanceReview.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setIsReviewDialogOpen(false);
      setSelectedReview(null);
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsGoalDialogOpen(false);
      setSelectedGoal(null);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PerformanceGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsGoalDialogOpen(false);
      setSelectedGoal(null);
    },
  });

  const handleCreateReview = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const empId = formData.get("employee_id");
    const emp = employees.find(e => e.id === empId);

    createReviewMutation.mutate({
      employee_id: empId,
      employee_name: emp?.full_name,
      reviewer_id: currentEmployee?.id,
      reviewer_name: currentEmployee?.full_name,
      review_period: formData.get("review_period"),
      review_type: formData.get("review_type"),
      status: "pending_self_assessment",
    });
  };

  const handleSelfAssessment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    updateReviewMutation.mutate({
      id: selectedReview.id,
      data: {
        self_assessment: {
          achievements: formData.get("achievements"),
          challenges: formData.get("challenges"),
          goals_progress: formData.get("goals_progress"),
          self_rating: parseFloat(formData.get("self_rating")),
          submitted_date: new Date().toISOString().split('T')[0],
        },
        status: "pending_manager_review",
      },
    });
  };

  const handleManagerReview = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    updateReviewMutation.mutate({
      id: selectedReview.id,
      data: {
        manager_review: {
          performance_rating: parseFloat(formData.get("performance_rating")),
          strengths: formData.get("strengths"),
          areas_for_improvement: formData.get("areas_for_improvement"),
          feedback: formData.get("feedback"),
          promotion_ready: formData.get("promotion_ready") === "true",
          submitted_date: new Date().toISOString().split('T')[0],
        },
        overall_rating: parseFloat(formData.get("performance_rating")),
        status: "completed",
        completed_date: new Date().toISOString().split('T')[0],
      },
    });
  };

  const handleCreateGoal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const empId = formData.get("employee_id");
    const emp = employees.find(e => e.id === empId);

    const data = {
      employee_id: empId,
      employee_name: emp?.full_name,
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      target_date: formData.get("target_date"),
      metrics: formData.get("metrics"),
      set_by: currentEmployee?.id,
      set_by_name: currentEmployee?.full_name,
      status: "not_started",
      progress: 0,
    };

    if (selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleUpdateGoalProgress = (goalId, newProgress, newStatus) => {
    updateGoalMutation.mutate({
      id: goalId,
      data: { progress: newProgress, status: newStatus },
    });
  };

  const isAdmin = user?.role === "admin";
  const myReviews = currentEmployee 
    ? reviews.filter(r => r.employee_id === currentEmployee.id)
    : [];
  const myTeamReviews = currentEmployee
    ? reviews.filter(r => r.reviewer_id === currentEmployee.id)
    : [];
  const myGoals = currentEmployee
    ? goals.filter(g => g.employee_id === currentEmployee.id)
    : [];

  const pendingReviews = myReviews.filter(r => r.status !== "completed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Management"
        subtitle="Track goals, reviews, and employee development"
      />

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Performance Reviews</h2>
            {isAdmin && (
              <Button onClick={() => setIsReviewDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Review
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{pendingReviews.length}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {myReviews.filter(r => r.status === "completed").length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {myReviews.filter(r => r.overall_rating).length > 0
                    ? (myReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / 
                       myReviews.filter(r => r.overall_rating).length).toFixed(1)
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {!isAdmin && myReviews.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myReviews.map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{review.review_period}</h3>
                          <Badge variant="outline" className="capitalize">
                            {review.review_type?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={review.status} />
                          {review.overall_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium">{review.overall_rating}/5</span>
                            </div>
                          )}
                        </div>
                        {review.employee_id && (
                          <div className="text-xs text-slate-500 mt-2">
                            Training completed: {trainingAssignments.filter(t => t.employee_id === review.employee_id && t.status === "completed").length}
                          </div>
                        )}
                      </div>
                      {review.status === "pending_self_assessment" && (
                        <Button
                          onClick={() => {
                            setSelectedReview(review);
                            setIsReviewDialogOpen(true);
                          }}
                          variant="outline"
                          className="text-indigo-600"
                        >
                          Complete Self-Assessment
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>All Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{review.employee_name}</h3>
                            <span className="text-sm text-slate-500">• {review.review_period}</span>
                            <Badge variant="outline" className="capitalize">
                              {review.review_type?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={review.status} />
                            {review.overall_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-medium">{review.overall_rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {review.status === "pending_manager_review" && review.reviewer_id === currentEmployee?.id && (
                          <Button
                            onClick={() => {
                              setSelectedReview(review);
                              setIsReviewDialogOpen(true);
                            }}
                            variant="outline"
                            className="text-indigo-600"
                          >
                            Complete Review
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description="Create performance reviews for your team"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Performance Goals</h2>
            <Button onClick={() => {
              setSelectedGoal(null);
              setIsGoalDialogOpen(true);
            }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Set Goal
            </Button>
          </div>

          {myGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myGoals.map((goal) => (
                <Card key={goal.id} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{goal.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsGoalDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {goal.category?.replace(/_/g, " ")}
                      </Badge>
                      <StatusBadge status={goal.status} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Progress</span>
                        <span className="text-sm font-bold text-indigo-600">{goal.progress || 0}%</span>
                      </div>
                      <Progress value={goal.progress || 0} className="h-2" />
                    </div>

                    {goal.target_date && (
                      <p className="text-sm text-slate-500">
                        Target: {format(parseISO(goal.target_date), "MMM d, yyyy")}
                      </p>
                    )}

                    {goal.status !== "completed" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateGoalProgress(goal.id, Math.min((goal.progress || 0) + 25, 100), goal.progress >= 75 ? "completed" : "in_progress")}
                        >
                          +25% Progress
                        </Button>
                        {goal.progress >= 100 && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleUpdateGoalProgress(goal.id, 100, "completed")}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No goals set"
              description="Create performance goals to track your progress"
              action={() => setIsGoalDialogOpen(true)}
              actionLabel="Set Goal"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Review Dialog */}
      <Dialog open={isReviewDialogOpen && !selectedReview} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee *</Label>
              <Select name="employee_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review_period">Review Period *</Label>
                <Input
                  id="review_period"
                  name="review_period"
                  placeholder="e.g., Q1 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_type">Review Type *</Label>
                <Select name="review_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Create Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Self-Assessment / Manager Review Dialog */}
      <Dialog open={isReviewDialogOpen && selectedReview} onOpenChange={(open) => {
        setIsReviewDialogOpen(open);
        if (!open) setSelectedReview(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.status === "pending_self_assessment" ? "Self-Assessment" : "Manager Review"}
            </DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <>
              {selectedReview.status === "pending_self_assessment" ? (
                <form onSubmit={handleSelfAssessment} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-900">{selectedReview.review_period}</h3>
                    <p className="text-sm text-slate-500 capitalize">{selectedReview.review_type} Review</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="achievements">Key Achievements *</Label>
                    <Textarea
                      id="achievements"
                      name="achievements"
                      placeholder="What were your major accomplishments this period?"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challenges">Challenges Faced</Label>
                    <Textarea
                      id="challenges"
                      name="challenges"
                      placeholder="What challenges did you encounter?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals_progress">Progress on Goals</Label>
                    <Textarea
                      id="goals_progress"
                      name="goals_progress"
                      placeholder="How did you progress on your goals?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="self_rating">Self Rating (1-5) *</Label>
                    <Select name="self_rating" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate your performance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Needs Improvement</SelectItem>
                        <SelectItem value="2">2 - Below Expectations</SelectItem>
                        <SelectItem value="3">3 - Meets Expectations</SelectItem>
                        <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                        <SelectItem value="5">5 - Outstanding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsReviewDialogOpen(false);
                      setSelectedReview(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      Submit Assessment
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleManagerReview} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-900">{selectedReview.employee_name}</h3>
                    <p className="text-sm text-slate-500">{selectedReview.review_period} • {selectedReview.review_type}</p>
                  </div>

                  {selectedReview.self_assessment && (
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-slate-900">Self-Assessment</h4>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Achievements:</p>
                        <p className="text-sm text-slate-600">{selectedReview.self_assessment.achievements}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">Self Rating:</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{selectedReview.self_assessment.self_rating}/5</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="performance_rating">Performance Rating (1-5) *</Label>
                    <Select name="performance_rating" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate performance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Needs Improvement</SelectItem>
                        <SelectItem value="2">2 - Below Expectations</SelectItem>
                        <SelectItem value="3">3 - Meets Expectations</SelectItem>
                        <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                        <SelectItem value="5">5 - Outstanding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strengths">Key Strengths *</Label>
                    <Textarea
                      id="strengths"
                      name="strengths"
                      placeholder="What are the employee's strengths?"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
                    <Textarea
                      id="areas_for_improvement"
                      name="areas_for_improvement"
                      placeholder="Where can the employee improve?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Additional Feedback</Label>
                    <Textarea
                      id="feedback"
                      name="feedback"
                      placeholder="Any additional feedback..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promotion_ready">Promotion Ready?</Label>
                    <Select name="promotion_ready">
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsReviewDialogOpen(false);
                      setSelectedReview(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                      Submit Review
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? "Edit Goal" : "Set New Goal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee *</Label>
              <Select name="employee_id" defaultValue={selectedGoal?.employee_id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={selectedGoal?.title}
                placeholder="e.g., Improve customer satisfaction score"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedGoal?.description}
                placeholder="Detailed description of the goal..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={selectedGoal?.category} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  name="target_date"
                  type="date"
                  defaultValue={selectedGoal?.target_date}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metrics">Success Metrics</Label>
              <Textarea
                id="metrics"
                name="metrics"
                defaultValue={selectedGoal?.metrics}
                placeholder="How will success be measured?"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => {
                setIsGoalDialogOpen(false);
                setSelectedGoal(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {selectedGoal ? "Update Goal" : "Create Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}