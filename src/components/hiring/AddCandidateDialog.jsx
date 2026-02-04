import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";

export default function AddCandidateDialog({ isOpen, onClose, jobOpenings }) {
  const [formData, setFormData] = useState({
    job_opening_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    cover_letter: "",
    source: "website",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const createCandidateMutation = useMutation({
    mutationFn: (data) => base44.entities.JobCandidate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCandidates"] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      job_opening_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      linkedin_url: "",
      portfolio_url: "",
      cover_letter: "",
      source: "website",
    });
    setResumeFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let resumeUrl = null;

    // Upload resume if provided
    if (resumeFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: resumeFile });
        resumeUrl = file_url;
      } catch (error) {
        console.error('Resume upload error:', error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const selectedJob = jobOpenings.find(j => j.id === formData.job_opening_id);

    const candidateData = {
      ...formData,
      resume_url: resumeUrl,
      job_title: selectedJob?.title,
      status: "applied"
    };

    const candidate = await createCandidateMutation.mutateAsync(candidateData);

    // Trigger AI analysis if resume was uploaded
    if (resumeUrl && selectedJob) {
      setAnalyzing(true);
      try {
        await base44.functions.invoke('analyzeResume', {
          candidate_id: candidate.id,
          resume_url: resumeUrl,
          job_requirements: selectedJob.requirements || selectedJob.description || ""
        });
      } catch (error) {
        console.error('AI analysis error:', error);
      }
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Candidate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Job Opening *</Label>
            <Select value={formData.job_opening_id} onValueChange={(value) => setFormData({ ...formData, job_opening_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select job..." />
              </SelectTrigger>
              <SelectContent>
                {jobOpenings.filter(j => j.status === "open").map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Resume (PDF, DOC, DOCX)</Label>
            <div className="mt-1">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {resumeFile ? resumeFile.name : "Click to upload resume"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">AI will analyze automatically</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Portfolio URL</Label>
              <Input
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Source</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Company Website</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="job_board">Job Board</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cover Letter</Label>
            <Textarea
              value={formData.cover_letter}
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={uploading || analyzing}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Add Candidate"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}