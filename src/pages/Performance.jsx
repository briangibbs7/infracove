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
  AlertCircle,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ThreeSixtyFeedbackDialog from "@/components/performance/ThreeSixtyFeedbackDialog";
import AISummaryCard from "@/components/performance/AISummaryCard";
import GoalProgressTracker from "@/components/performance/GoalProgressTracker";
import GiveFeedbackDialog from "@/components/performance/GiveFeedbackDialog";
import RequestFeedbackDialog from "@/components/performance/RequestFeedbackDialog";
import FeedbackDashboard from "@/components/performance/FeedbackDashboard";
import FeedbackTimeline from "@/components/performance/FeedbackTimeline";

export default function Performance() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [is360DialogOpen, setIs360DialogOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isRequestFeedbackOpen, setIsRequestFeedbackOpen] = useState(false);
  const [feedbackRecipient, setFeedbackRecipient] = useState(null);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
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

  const { data: continuousFeedback = [] } = useQuery({
    queryKey: ["continuous-feedback"],
    queryFn: () => base44.entities.ContinuousFeedback.list("-created_date"),
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

  const handleUpdateGoalProgress = (goalId, updatedData) => {
    updateGoalMutation.mutate({
      id: goalId,
      data: updatedData,
    });
  };

  const handleSubmit360Feedback = async (feedbackData) => {
    const existing360 = selectedReview.feedback_360 || [];
    existing360.push(feedbackData);

    await updateReviewMutation.mutateAsync({
      id: selectedReview.id,
      data: {
        feedback_360: existing360
      }
    });

    setIs360DialogOpen(false);
    setSelectedReview(null);
  };

  const handleGenerateAISummary = async (reviewId) => {
    setGeneratingSummary(true);
    try {
      await base44.functions.invoke('summarizePerformanceReview', { review_id: reviewId });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
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

  const myFeedbackRequests = currentEmployee
    ? continuousFeedback.filter(f => f.giver_id === currentEmployee.id && f.type === "request" && f.status === "pending")
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Management"
        subtitle="Track goals, reviews, and employee development"
      />

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="360feedback">360° Feedback</TabsTrigger>
          <TabsTrigger value="continuous" className="relative">
            Continuous Feedback
            {myFeedbackRequests.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {myFeedbackRequests.length}
              </Badge>
            )}
          </TabsTrigger>
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
                      <div className="flex gap-2">
                        {review.status === "pending_self_assessment" && (
                          <Button
                            onClick={() => {
                              setSelectedReview(review);
                              setIsReviewDialogOpen(true);
                            }}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Complete Self-Assessment
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingReview(review)}
                        >
                          View Details
                        </Button>
                      </div>
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
                        <div className="flex gap-2">
                          {review.status === "pending_manager_review" && review.reviewer_id === currentEmployee?.id && (
                            <Button
                              onClick={() => {
                                setSelectedReview(review);
                                setIsReviewDialogOpen(true);
                              }}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              Complete Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingReview(review)}
                          >
                            View Details
                          </Button>
                        </div>
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

        {/* 360 Feedback Tab */}
        <TabsContent value="360feedback" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">360° Feedback</h2>
              <p className="text-sm text-slate-500">Provide feedback for your colleagues</p>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Available Reviews for Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.filter(r => 
                r.status === "pending_360_feedback" && r.employee_id !== currentEmployee?.id
              ).length > 0 ? (
                <div className="space-y-3">
                  {reviews.filter(r => 
                    r.status === "pending_360_feedback" && r.employee_id !== currentEmployee?.id
                  ).map((review) => {
                    const alreadyProvided = review.feedback_360?.some(f => f.reviewer_id === currentEmployee?.id);
                    return (
                      <div key={review.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-slate-900">{review.employee_name}</h3>
                          <p className="text-sm text-slate-500">{review.review_period}</p>
                        </div>
                        {alreadyProvided ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Feedback Submitted</Badge>
                        ) : (
                          <Button
                            onClick={() => {
                              setSelectedReview(review);
                              setIs360DialogOpen(true);
                            }}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            Provide Feedback
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No reviews available"
                  description="No colleagues currently need your feedback"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Continuous Feedback Tab */}
        <TabsContent value="continuous" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Continuous Feedback</h2>
              <p className="text-sm text-slate-500">Give and receive feedback anytime</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsRequestFeedbackOpen(true)}
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Feedback
              </Button>
              <Button
                onClick={() => {
                  setFeedbackRecipient(null);
                  setIsFeedbackDialogOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Give Feedback
              </Button>
            </div>
          </div>

          {/* Feedback Dashboard */}
          {currentEmployee && (
            <FeedbackDashboard
              feedback={continuousFeedback}
              employeeId={currentEmployee.id}
            />
          )}

          {/* Feedback Filter */}
          <div className="flex gap-2">
            <Button
              variant={feedbackFilter === "all" ? "default" : "outline"}
              onClick={() => setFeedbackFilter("all")}
              size="sm"
            >
              All Feedback
            </Button>
            <Button
              variant={feedbackFilter === "received" ? "default" : "outline"}
              onClick={() => setFeedbackFilter("received")}
              size="sm"
            >
              Received
            </Button>
            <Button
              variant={feedbackFilter === "given" ? "default" : "outline"}
              onClick={() => setFeedbackFilter("given")}
              size="sm"
            >
              Given
            </Button>
            <Button
              variant={feedbackFilter === "requests" ? "default" : "outline"}
              onClick={() => setFeedbackFilter("requests")}
              size="sm"
              className="relative"
            >
              Requests
              {myFeedbackRequests.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {myFeedbackRequests.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Feedback Timeline */}
          {currentEmployee && (
            <FeedbackTimeline
              feedback={continuousFeedback}
              currentUser={currentEmployee}
              filter={feedbackFilter}
            />
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

                    <GoalProgressTracker
                     goal={goal}
                     onUpdate={(goalId, data) => handleUpdateGoalProgress(goalId, data)}
                    />
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

      {/* 360 Feedback Dialog */}
      <Dialog open={is360DialogOpen} onOpenChange={setIs360DialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provide 360° Feedback</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <ThreeSixtyFeedbackDialog
              review={selectedReview}
              currentEmployee={currentEmployee}
              onSubmit={handleSubmit360Feedback}
              onCancel={() => {
                setIs360DialogOpen(false);
                setSelectedReview(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Review Details Dialog */}
      <Dialog open={!!viewingReview} onOpenChange={(open) => !open && setViewingReview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details - {viewingReview?.employee_name}</DialogTitle>
          </DialogHeader>
          {viewingReview && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-slate-900">{viewingReview.review_period}</h3>
                  <p className="text-sm text-slate-500 capitalize">{viewingReview.review_type} Review</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={viewingReview.status} />
                  {viewingReview.overall_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-xl font-bold">{viewingReview.overall_rating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {viewingReview.ai_summary ? (
                <AISummaryCard aiSummary={viewingReview.ai_summary} />
              ) : viewingReview.status === "completed" && (
                <Button
                  onClick={() => handleGenerateAISummary(viewingReview.id)}
                  disabled={generatingSummary}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {generatingSummary ? "Generating AI Summary..." : "Generate AI Summary"}
                </Button>
              )}

              {viewingReview.self_assessment && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base">Self-Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Achievements:</p>
                      <p className="text-sm text-slate-600 mt-1">{viewingReview.self_assessment.achievements}</p>
                    </div>
                    {viewingReview.self_assessment.challenges && (
                      <div>
                        <p className="text-sm font-medium text-slate-700">Challenges:</p>
                        <p className="text-sm text-slate-600 mt-1">{viewingReview.self_assessment.challenges}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">Self Rating:</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{viewingReview.self_assessment.self_rating}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {viewingReview.manager_review && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base">Manager Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Strengths:</p>
                      <p className="text-sm text-slate-600 mt-1">{viewingReview.manager_review.strengths}</p>
                    </div>
                    {viewingReview.manager_review.areas_for_improvement && (
                      <div>
                        <p className="text-sm font-medium text-slate-700">Areas for Improvement:</p>
                        <p className="text-sm text-slate-600 mt-1">{viewingReview.manager_review.areas_for_improvement}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">Performance Rating:</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{viewingReview.manager_review.performance_rating}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {viewingReview.feedback_360 && viewingReview.feedback_360.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base">360° Feedback ({viewingReview.feedback_360.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {viewingReview.feedback_360.map((feedback, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{feedback.reviewer_name}</p>
                            <Badge variant="outline" className="capitalize mt-1">
                              {feedback.relationship?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Collab</p>
                              <p className="text-sm font-bold text-indigo-600">{feedback.collaboration_rating}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Comm</p>
                              <p className="text-sm font-bold text-indigo-600">{feedback.communication_rating}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Tech</p>
                              <p className="text-sm font-bold text-indigo-600">{feedback.technical_skills_rating}</p>
                            </div>
                          </div>
                        </div>
                        {feedback.strengths && (
                          <div>
                            <p className="text-xs font-medium text-slate-700">Strengths:</p>
                            <p className="text-sm text-slate-600">{feedback.strengths}</p>
                          </div>
                        )}
                        {feedback.areas_for_improvement && (
                          <div>
                            <p className="text-xs font-medium text-slate-700">Areas for Improvement:</p>
                            <p className="text-sm text-slate-600">{feedback.areas_for_improvement}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Give Feedback Dialog */}
      {currentEmployee && (
        <GiveFeedbackDialog
          open={isFeedbackDialogOpen}
          onClose={() => {
            setIsFeedbackDialogOpen(false);
            setFeedbackRecipient(null);
          }}
          recipientId={feedbackRecipient?.id || currentEmployee.id}
          recipientName={feedbackRecipient?.full_name || currentEmployee.full_name}
          currentUser={currentEmployee}
        />
      )}

      {/* Request Feedback Dialog */}
      {currentEmployee && (
        <RequestFeedbackDialog
          open={isRequestFeedbackOpen}
          onClose={() => setIsRequestFeedbackOpen(false)}
          currentEmployee={currentEmployee}
          currentUser={user}
        />
      )}

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