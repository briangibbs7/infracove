import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import JobOpeningDialog from "@/components/hiring/JobOpeningDialog";
import CandidateDetailsDialog from "@/components/hiring/CandidateDetailsDialog";
import AddCandidateDialog from "@/components/hiring/AddCandidateDialog";
import CandidateCard from "@/components/hiring/CandidateCard";
import QuickScreeningView from "@/components/hiring/QuickScreeningView";
import { Plus, Briefcase, Users, TrendingUp, CheckCircle, UserPlus, Zap } from "lucide-react";

const WORKFLOW_STAGES = [
  { id: "applied", label: "Applied", color: "bg-slate-100 text-slate-700" },
  { id: "screening", label: "Screening", color: "bg-blue-100 text-blue-700" },
  { id: "phone_screen_scheduled", label: "Phone Screen", color: "bg-cyan-100 text-cyan-700" },
  { id: "interview_scheduled", label: "Interview", color: "bg-purple-100 text-purple-700" },
  { id: "interviewed", label: "Interviewed", color: "bg-indigo-100 text-indigo-700" },
  { id: "offer_extended", label: "Offer Extended", color: "bg-amber-100 text-amber-700" },
  { id: "offer_accepted", label: "Offer Accepted", color: "bg-green-100 text-green-700" },
];

export default function Hiring() {
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showCandidateDialog, setShowCandidateDialog] = useState(false);
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const queryClient = useQueryClient();

  const { data: jobOpenings = [] } = useQuery({
    queryKey: ["jobOpenings"],
    queryFn: () => base44.entities.JobOpening.list("-created_date"),
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["jobCandidates"],
    queryFn: () => base44.entities.JobCandidate.list("-created_date"),
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobCandidate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCandidates"] });
    },
  });

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setShowJobDialog(true);
  };

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDialog(true);
  };

  const handleMoveStage = async (candidate, newStage) => {
    await updateCandidateMutation.mutateAsync({
      id: candidate.id,
      data: { status: newStage }
    });
  };

  const handleBulkAction = async (action) => {
    if (selectedCandidates.length === 0) return;
    
    for (const candidateId of selectedCandidates) {
      await updateCandidateMutation.mutateAsync({
        id: candidateId,
        data: { status: action }
      });
    }
    
    setSelectedCandidates([]);
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const openJobs = jobOpenings.filter(j => j.status === "open");
  
  let filteredCandidates = selectedJobFilter === "all" 
    ? candidates.filter(c => !["hired", "rejected", "withdrawn"].includes(c.status))
    : candidates.filter(c => c.job_opening_id === selectedJobFilter && !["hired", "rejected", "withdrawn"].includes(c.status));

  // Apply AI score filter
  if (scoreFilter !== "all") {
    filteredCandidates = filteredCandidates.filter(c => {
      const score = c.ai_analysis?.match_score || 0;
      if (scoreFilter === "high") return score >= 80;
      if (scoreFilter === "medium") return score >= 60 && score < 80;
      if (scoreFilter === "low") return score < 60;
      return true;
    });
  }

  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => !["hired", "rejected", "withdrawn"].includes(c.status)).length;
  const hired = candidates.filter(c => c.status === "hired").length;

  return (
    <div>
      <PageHeader
        title="Hiring & Recruitment"
        subtitle="Manage job openings and candidate pipeline"
      >
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCandidateDialog(true)} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
          <Button onClick={() => { setSelectedJob(null); setShowJobDialog(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Job Opening
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Positions</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{openJobs.length}</p>
              </div>
              <Briefcase className="w-10 h-10 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Candidates</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{totalCandidates}</p>
              </div>
              <Users className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Pipeline</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{activeCandidates}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Hired</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{hired}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Candidate Pipeline</TabsTrigger>
          <TabsTrigger value="screening">
            <Zap className="w-3 h-3 mr-1" />
            Quick Screening
          </TabsTrigger>
          <TabsTrigger value="jobs">Job Openings</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Job:</span>
                <select
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  className="border border-slate-200 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Jobs</option>
                  {openJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">AI Score:</span>
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="border border-slate-200 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High Match (80+)</option>
                  <option value="medium">Medium Match (60-79)</option>
                  <option value="low">Needs Review (&lt;60)</option>
                </select>
              </div>
            </div>

            {selectedCandidates.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-100 text-indigo-700">
                  {selectedCandidates.length} selected
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction("screening")}
                >
                  Move to Screening
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction("rejected")}
                  className="text-red-600"
                >
                  Reject Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedCandidates([])}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {WORKFLOW_STAGES.map(stage => {
              const stageCandidates = filteredCandidates.filter(c => c.status === stage.id);
              
              return (
                <div key={stage.id} className="flex flex-col">
                  <div className={`p-3 rounded-lg ${stage.color} mb-3`}>
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                    <Badge className="mt-1 bg-white/50">{stageCandidates.length}</Badge>
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    {stageCandidates.map(candidate => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onView={handleViewCandidate}
                        onMove={handleMoveStage}
                        stages={WORKFLOW_STAGES}
                        isSelected={selectedCandidates.includes(candidate.id)}
                        onToggleSelect={toggleCandidateSelection}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="screening">
          <QuickScreeningView
            candidates={candidates.filter(c => c.status === "applied")}
            onApprove={(candidate) => handleMoveStage(candidate, "screening")}
            onReject={(candidate) => handleMoveStage(candidate, "rejected")}
            onSkip={(candidate) => {}}
          />
        </TabsContent>

        <TabsContent value="jobs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobOpenings.map(job => {
              const jobCandidates = candidates.filter(c => c.job_opening_id === job.id);
              const activeJobCandidates = jobCandidates.filter(c => !["hired", "rejected", "withdrawn"].includes(c.status));
              
              return (
                <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{job.department}</p>
                      </div>
                      <Badge className={
                        job.status === "open" ? "bg-green-100 text-green-700" :
                        job.status === "filled" ? "bg-blue-100 text-blue-700" :
                        job.status === "on_hold" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Candidates:</span>
                        <span className="font-semibold">{activeJobCandidates.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Openings:</span>
                        <span className="font-semibold">{job.openings_count}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-semibold">{job.location}</span>
                        </div>
                      )}
                      <Button
                        onClick={() => handleEditJob(job)}
                        variant="outline"
                        className="w-full mt-3"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <JobOpeningDialog
        isOpen={showJobDialog}
        onClose={() => { setShowJobDialog(false); setSelectedJob(null); }}
        job={selectedJob}
      />

      <CandidateDetailsDialog
        isOpen={showCandidateDialog}
        onClose={() => { setShowCandidateDialog(false); setSelectedCandidate(null); }}
        candidate={selectedCandidate}
        jobOpenings={jobOpenings}
      />

      <AddCandidateDialog
        isOpen={showAddCandidateDialog}
        onClose={() => setShowAddCandidateDialog(false)}
        jobOpenings={jobOpenings}
      />
    </div>
  );
}