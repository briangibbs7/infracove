import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, FileText, ListChecks, GraduationCap, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function HRAIAssistant() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR AI Assistant</h1>
          <p className="text-slate-600">Automate repetitive HR tasks with AI-powered tools</p>
        </div>
      </div>

      <Tabs defaultValue="job-description" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="job-description">
            <FileText className="w-4 h-4 mr-2" />
            Job Descriptions
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <ListChecks className="w-4 h-4 mr-2" />
            Onboarding Checklists
          </TabsTrigger>
          <TabsTrigger value="training">
            <GraduationCap className="w-4 h-4 mr-2" />
            Training Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="job-description">
          <JobDescriptionGenerator />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingChecklistGenerator />
        </TabsContent>

        <TabsContent value="training">
          <TrainingSuggestions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobDescriptionGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    skills: "",
    experienceLevel: "mid",
    additionalInfo: "",
  });

  const generateJobDescription = async () => {
    if (!formData.jobTitle) {
      toast.error("Please enter a job title");
      return;
    }

    setLoading(true);
    try {
      const prompt = `Create a detailed and professional job description for the following role:

Job Title: ${formData.jobTitle}
Department: ${formData.department || "Not specified"}
Required Skills: ${formData.skills || "Not specified"}
Experience Level: ${formData.experienceLevel}
Additional Context: ${formData.additionalInfo || "None"}

Please provide a comprehensive job description with the following sections:
1. Job Title and Summary
2. Key Responsibilities (bullet points)
3. Required Qualifications
4. Preferred Qualifications
5. Skills and Competencies
6. Benefits and Perks (general)

Make it professional, engaging, and suitable for posting on job boards.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      setResult(response);
      toast.success("Job description generated!");
    } catch (error) {
      toast.error("Failed to generate job description");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Job Title *</Label>
            <Input
              placeholder="e.g., Senior Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            />
          </div>

          <div>
            <Label>Department</Label>
            <Input
              placeholder="e.g., Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div>
            <Label>Required Skills (comma-separated)</Label>
            <Input
              placeholder="e.g., React, Node.js, TypeScript"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>

          <div>
            <Label>Experience Level</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.experienceLevel}
              onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
            >
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior Level (5+ years)</option>
              <option value="lead">Lead/Principal (8+ years)</option>
            </select>
          </div>

          <div>
            <Label>Additional Information (Optional)</Label>
            <Textarea
              placeholder="Any specific requirements, company culture points, or other details..."
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              rows={3}
            />
          </div>

          <Button onClick={generateJobDescription} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Job Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:max-h-[800px] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Job Description</CardTitle>
            {result && (
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your generated job description will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingChecklistGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    role: "",
    department: "",
    seniority: "mid",
    specialRequirements: "",
  });

  const generateChecklist = async () => {
    if (!formData.role || !formData.department) {
      toast.error("Please enter role and department");
      return;
    }

    setLoading(true);
    try {
      const prompt = `Create a comprehensive onboarding checklist for a new employee with the following details:

Role: ${formData.role}
Department: ${formData.department}
Seniority Level: ${formData.seniority}
Special Requirements: ${formData.specialRequirements || "None"}

Please provide a detailed onboarding checklist organized by timeframe:
1. Pre-Start (Before Day 1) - tasks HR and IT need to complete
2. Day 1 - first day activities and introductions
3. Week 1 - initial training and setup
4. Month 1 - role-specific training and integration
5. Month 3 - performance check-in and advanced training

For each timeframe, include:
- Specific actionable tasks
- Who is responsible (Employee, Manager, HR, IT, etc.)
- Purpose/goal of each task

Format the output as a structured checklist with clear sections and bullet points.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      setResult(response);
      toast.success("Onboarding checklist generated!");
    } catch (error) {
      toast.error("Failed to generate checklist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Onboarding Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Employee Role *</Label>
            <Input
              placeholder="e.g., Software Engineer"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>

          <div>
            <Label>Department *</Label>
            <Input
              placeholder="e.g., Engineering"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div>
            <Label>Seniority Level</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead/Manager</option>
            </select>
          </div>

          <div>
            <Label>Special Requirements (Optional)</Label>
            <Textarea
              placeholder="Any role-specific tools, certifications, or training needed..."
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
              rows={4}
            />
          </div>

          <Button onClick={generateChecklist} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Checklist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:max-h-[800px] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Checklist</CardTitle>
            {result && (
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your generated onboarding checklist will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrainingSuggestions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    currentRole: "",
    currentSkills: "",
    careerGoal: "",
    skillGaps: "",
    learningStyle: "mixed",
  });

  const generateSuggestions = async () => {
    if (!formData.currentRole) {
      toast.error("Please enter current role");
      return;
    }

    setLoading(true);
    try {
      const prompt = `Recommend relevant training modules and courses for an employee with the following profile:

Current Role: ${formData.currentRole}
Current Skills: ${formData.currentSkills || "Not specified"}
Career Goal: ${formData.careerGoal || "Not specified"}
Identified Skill Gaps: ${formData.skillGaps || "Not specified"}
Learning Style Preference: ${formData.learningStyle}

Please provide:
1. **Priority Training Recommendations** (3-5 most important courses/modules)
   - Course/Module name
   - Why it's important for this person
   - Expected duration
   - Suggested providers/platforms (Coursera, Udemy, LinkedIn Learning, etc.)

2. **Long-term Development Path** (6-12 month plan)
   - Quarterly learning goals
   - Skills to develop in sequence

3. **Quick Wins** (2-3 short courses/tutorials for immediate impact)

4. **On-the-job Learning Opportunities**
   - Projects or tasks that would help develop needed skills
   - Mentorship or shadowing suggestions

Format the recommendations clearly with actionable next steps.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true, // Use internet context for up-to-date course recommendations
      });

      setResult(response);
      toast.success("Training recommendations generated!");
    } catch (error) {
      toast.error("Failed to generate recommendations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Training Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Role *</Label>
            <Input
              placeholder="e.g., Junior Data Analyst"
              value={formData.currentRole}
              onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
            />
          </div>

          <div>
            <Label>Current Skills</Label>
            <Textarea
              placeholder="e.g., Excel, SQL, basic Python"
              value={formData.currentSkills}
              onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Career Goal</Label>
            <Input
              placeholder="e.g., Become a Senior Data Scientist"
              value={formData.careerGoal}
              onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
            />
          </div>

          <div>
            <Label>Identified Skill Gaps</Label>
            <Textarea
              placeholder="e.g., Machine learning, advanced statistics, data visualization"
              value={formData.skillGaps}
              onChange={(e) => setFormData({ ...formData, skillGaps: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Learning Style Preference</Label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.learningStyle}
              onChange={(e) => setFormData({ ...formData, learningStyle: e.target.value })}
            >
              <option value="video">Video-based courses</option>
              <option value="reading">Reading/Documentation</option>
              <option value="hands-on">Hands-on projects</option>
              <option value="mixed">Mixed approach</option>
            </select>
          </div>

          <Button onClick={generateSuggestions} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Using AI + internet for up-to-date course recommendations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:max-h-[800px] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training Recommendations</CardTitle>
            {result && (
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your training recommendations will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}