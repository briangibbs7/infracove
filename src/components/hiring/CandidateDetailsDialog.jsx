import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Linkedin, Globe, Briefcase, Calendar, Star, FileText, Download, CheckCircle, XCircle, Sparkles, Send } from "lucide-react";
import { format, parseISO } from "date-fns";
import AIAnalysisCard from "./AIAnalysisCard";
import SendEmailDialog from "./SendEmailDialog";
import ScheduleInterviewDialog from "./ScheduleInterviewDialog";

export default function CandidateDetailsDialog({ isOpen, onClose, candidate, jobOpenings }) {
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: communicationHistory = [] } = useQuery({
    queryKey: ["candidateEmails", candidate?.id],
    queryFn: () => base44.entities.CandidateEmail.filter({ candidate_id: candidate.id }, "-sent_date"),
    enabled: !!candidate && isOpen
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JobCandidate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCandidates"] });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      const employee = await base44.entities.Employee.create(data);
      return employee;
    },
    onSuccess: async (employee) => {
      await updateCandidateMutation.mutateAsync({
        id: candidate.id,
        data: { status: "hired" }
      });
      
      // Trigger onboarding
      try {
        await base44.functions.invoke('triggerOnboarding', { employee_id: employee.id });
      } catch (error) {
        console.error('Onboarding trigger error:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
  });

  if (!candidate) return null;

  const job = jobOpenings.find(j => j.id === candidate.job_opening_id);

  const handleAddNote = async () => {
    if (!note.trim()) return;

    const user = await base44.auth.me();
    const newNote = {
      stage: candidate.status,
      note: note,
      created_by: user.id,
      created_by_name: user.full_name,
      created_date: new Date().toISOString(),
    };

    const updatedNotes = [...(candidate.stage_notes || []), newNote];
    
    await updateCandidateMutation.mutateAsync({
      id: candidate.id,
      data: { stage_notes: updatedNotes }
    });

    setNote("");
  };

  const handleUpdateRating = async (newRating) => {
    setRating(newRating);
    await updateCandidateMutation.mutateAsync({
      id: candidate.id,
      data: { overall_rating: newRating }
    });
  };

  const handleReject = async () => {
    if (confirm("Are you sure you want to reject this candidate?")) {
      await updateCandidateMutation.mutateAsync({
        id: candidate.id,
        data: { status: "rejected" }
      });
      onClose();
    }
  };

  const handleHire = async () => {
    if (!confirm("Convert this candidate to an employee and start onboarding?")) return;

    const employeeData = {
      full_name: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      phone: candidate.phone,
      job_title: candidate.job_title,
      department: job?.department || "IT",
      employment_type: job?.employment_type || "full_time",
      status: "onboarding",
      start_date: new Date().toISOString().split('T')[0],
    };

    await createEmployeeMutation.mutateAsync(employeeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{candidate.first_name} {candidate.last_name}</DialogTitle>
              <p className="text-slate-600 mt-1">{candidate.job_title}</p>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700">
              {candidate.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai-analysis">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="communication">
              <Mail className="w-3 h-3 mr-1" />
              Communication ({communicationHistory.length})
            </TabsTrigger>
            <TabsTrigger value="notes">Notes ({candidate.stage_notes?.length || 0})</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${candidate.email}`} className="text-indigo-600 hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.linkedin_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4 text-slate-400" />
                      <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {candidate.portfolio_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        Portfolio
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Rating</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleUpdateRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (rating || candidate.overall_rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {candidate.resume_url && (
                <div>
                  <h3 className="font-semibold mb-2">Resume</h3>
                  <a
                    href={candidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    View Resume
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              )}

              {candidate.current_company && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>Currently at: <strong>{candidate.current_company}</strong></span>
                </div>
              )}

              {candidate.years_of_experience && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span><strong>{candidate.years_of_experience}</strong> years of experience</span>
                </div>
              )}

              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {candidate.cover_letter && (
                <div>
                  <h3 className="font-semibold mb-2">Cover Letter</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidate.cover_letter}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-analysis">
            <AIAnalysisCard analysis={candidate.ai_analysis} />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Button onClick={() => setShowEmailDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>

            <div className="space-y-3">
              {communicationHistory.map((email) => (
                <div key={email.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{email.subject}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(parseISO(email.sent_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {email.template_name && (
                      <Badge variant="outline" className="text-xs">
                        {email.template_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{email.body}</p>
                  <p className="text-xs text-slate-500 mt-2">Sent by {email.sent_by_name}</p>
                </div>
              ))}

              {communicationHistory.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No emails sent yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div>
              <Textarea
                placeholder="Add a note about this candidate..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
                Add Note
              </Button>
            </div>

            <div className="space-y-3">
              {candidate.stage_notes?.map((n, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{n.created_by_name}</p>
                      <p className="text-xs text-slate-500">{format(parseISO(n.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{n.stage}</Badge>
                  </div>
                  <p className="text-sm text-slate-700">{n.note}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            <div className="mb-4">
              <Button onClick={() => setShowScheduleDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            </div>

            {candidate.interview_dates && candidate.interview_dates.length > 0 ? (
              candidate.interview_dates.map((interview, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{interview.type || "Interview"}</p>
                      <p className="text-sm text-slate-600">{interview.interviewer}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(interview.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  {interview.rating && (
                    <div className="flex items-center gap-1 my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < interview.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      ))}
                    </div>
                  )}
                  {interview.feedback && (
                    <p className="text-sm text-slate-700 mt-2">{interview.feedback}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No interviews scheduled yet</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button onClick={handleReject} variant="outline" className="text-red-600 hover:text-red-700">
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {candidate.status === "offer_accepted" && (
              <Button onClick={handleHire} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Hire & Start Onboarding
              </Button>
            )}
          </div>
        </div>

        <SendEmailDialog
          isOpen={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          candidate={candidate}
        />

        <ScheduleInterviewDialog
          isOpen={showScheduleDialog}
          onClose={() => setShowScheduleDialog(false)}
          candidate={candidate}
        />
      </DialogContent>
    </Dialog>
  );
}