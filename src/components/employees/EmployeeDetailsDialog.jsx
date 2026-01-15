import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Briefcase } from "lucide-react";

export default function EmployeeDetailsDialog({ employee, onUpdate }) {
  const [skills, setSkills] = useState(employee?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState(employee?.emergency_contacts || []);
  const [jobHistory, setJobHistory] = useState(employee?.job_history || []);

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: "", phone: "", relationship: "", is_primary: false }
    ]);
  };

  const updateEmergencyContact = (index, field, value) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const removeEmergencyContact = (index) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const addJobHistory = () => {
    setJobHistory([
      ...jobHistory,
      { title: "", department: "", start_date: "", end_date: "", notes: "" }
    ]);
  };

  const updateJobHistory = (index, field, value) => {
    const updated = [...jobHistory];
    updated[index][field] = value;
    setJobHistory(updated);
  };

  const removeJobHistory = (index) => {
    setJobHistory(jobHistory.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdate({
      skills,
      emergency_contacts: emergencyContacts,
      job_history: jobHistory
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <div>
            <Label>Add Skills</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="e.g., JavaScript, Project Management"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="gap-2">
                {skill}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeSkill(index)}
                />
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Button type="button" onClick={addEmergencyContact} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Emergency Contact
          </Button>
          {emergencyContacts.map((contact, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Contact {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmergencyContact(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(index, "phone", e.target.value)}
                  />
                  <Input
                    placeholder="Relationship"
                    value={contact.relationship}
                    onChange={(e) => updateEmergencyContact(index, "relationship", e.target.value)}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.is_primary}
                      onChange={(e) => updateEmergencyContact(index, "is_primary", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Primary Contact</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Button type="button" onClick={addJobHistory} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Job Entry
          </Button>
          {jobHistory.map((job, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-sm">Position {index + 1}</CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJobHistory(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Job Title"
                    value={job.title}
                    onChange={(e) => updateJobHistory(index, "title", e.target.value)}
                  />
                  <Input
                    placeholder="Department"
                    value={job.department}
                    onChange={(e) => updateJobHistory(index, "department", e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={job.start_date}
                    onChange={(e) => updateJobHistory(index, "start_date", e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={job.end_date}
                    onChange={(e) => updateJobHistory(index, "end_date", e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Notes"
                  value={job.notes}
                  onChange={(e) => updateJobHistory(index, "notes", e.target.value)}
                  rows={2}
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
          Save Changes
        </Button>
      </div>
    </div>
  );
}