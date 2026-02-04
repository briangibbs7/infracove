import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import PageHeader from "@/components/ui/PageHeader";
import SurveyBuilder from "@/components/surveys/SurveyBuilder";
import SurveyList from "@/components/surveys/SurveyList";
import {
  Plus,
  BarChart3,
  Users,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function Surveys() {
  const [user, setUser] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [viewSurveyOpen, setViewSurveyOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: surveys = [], isLoading: surveysLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => base44.entities.Survey.list(),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["surveyResponses"],
    queryFn: () => base44.entities.SurveyResponse.list(),
  });

  const createSurveyMutation = useMutation({
    mutationFn: (surveyData) => base44.entities.Survey.create(surveyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey created successfully");
      setBuilderOpen(false);
      setEditingSurvey(null);
    },
    onError: () => toast.error("Failed to create survey"),
  });

  const updateSurveyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Survey.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey updated successfully");
      setBuilderOpen(false);
      setEditingSurvey(null);
    },
    onError: () => toast.error("Failed to update survey"),
  });

  const handleSaveSurvey = (surveyData) => {
    const dataToSave = {
      ...surveyData,
      created_by: user?.email,
      created_by_name: user?.full_name,
    };

    if (editingSurvey) {
      updateSurveyMutation.mutate({ id: editingSurvey.id, data: dataToSave });
    } else {
      createSurveyMutation.mutate(dataToSave);
    }
  };

  const handleArchiveSurvey = (survey) => {
    updateSurveyMutation.mutate({
      id: survey.id,
      data: { status: "archived" },
    });
  };

  const handleEditSurvey = (survey) => {
    setEditingSurvey(survey);
    setBuilderOpen(true);
  };

  const activeSurveys = surveys.filter((s) => s.status === "active").length;
  const completedSurveys = surveys.filter((s) => s.status === "closed").length;
  const totalResponses = responses.length;
  const avgCompletionRate =
    surveys.length > 0
      ? Math.round(
          surveys.reduce((sum, s) => sum + (s.completion_rate || 0), 0) /
            surveys.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        subtitle="Create and manage employee surveys"
        action={{
          label: "Create Survey",
          icon: Plus,
          onClick: () => {
            setEditingSurvey(null);
            setBuilderOpen(true);
          },
        }}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Surveys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{activeSurveys}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{completedSurveys}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{totalResponses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Avg. Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{avgCompletionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Surveys ({surveys.length})
          </TabsTrigger>
          <TabsTrigger value="active">Active ({activeSurveys})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSurveys})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {surveysLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading surveys...
            </div>
          ) : surveys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No surveys yet.</p>
                <Button
                  onClick={() => {
                    setEditingSurvey(null);
                    setBuilderOpen(true);
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  Create your first survey
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SurveyList
              surveys={surveys}
              onView={(survey) => {
                setSelectedSurvey(survey);
                setViewSurveyOpen(true);
              }}
              onEdit={handleEditSurvey}
              onArchive={handleArchiveSurvey}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {surveys.filter((s) => s.status === "active").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active surveys
              </CardContent>
            </Card>
          ) : (
            <SurveyList
              surveys={surveys.filter((s) => s.status === "active")}
              onView={(survey) => {
                setSelectedSurvey(survey);
                setViewSurveyOpen(true);
              }}
              onEdit={handleEditSurvey}
              onArchive={handleArchiveSurvey}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {surveys.filter((s) => s.status === "closed").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No completed surveys
              </CardContent>
            </Card>
          ) : (
            <SurveyList
              surveys={surveys.filter((s) => s.status === "closed")}
              onView={(survey) => {
                setSelectedSurvey(survey);
                setViewSurveyOpen(true);
              }}
              onEdit={handleEditSurvey}
              onArchive={handleArchiveSurvey}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Survey Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSurvey ? "Edit Survey" : "Create Survey"}
            </DialogTitle>
          </DialogHeader>
          <SurveyBuilder
            initialSurvey={editingSurvey}
            onSave={handleSaveSurvey}
            isLoading={
              createSurveyMutation.isPending || updateSurveyMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* View Survey Dialog */}
      <Dialog open={viewSurveyOpen} onOpenChange={setViewSurveyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSurvey?.title}</DialogTitle>
          </DialogHeader>
          {selectedSurvey && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Description
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedSurvey.description || "No description"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-lg font-bold">
                    {selectedSurvey.questions?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responses</p>
                  <p className="text-lg font-bold">
                    {selectedSurvey.response_count || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">
                  Questions
                </p>
                <div className="space-y-3">
                  {selectedSurvey.questions?.map((q, i) => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-50 rounded border border-slate-200"
                    >
                      <p className="text-sm font-medium">
                        {i + 1}. {q.question_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {q.question_type}
                        {q.is_required ? " • Required" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewSurveyOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}