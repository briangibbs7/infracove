import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";

export default function SkillMatrixEditor({ employee, currentUser, onSave, onCancel }) {
  const queryClient = useQueryClient();

  const { data: companySkills = [] } = useQuery({
    queryKey: ["companySkills"],
    queryFn: () => base44.entities.CompanySkill.filter({ status: "active" }),
  });

  const { data: employeeSkills = [] } = useQuery({
    queryKey: ["employeeSkills", employee.id],
    queryFn: () => base44.entities.EmployeeSkill.filter({ employee_id: employee.id }),
  });

  const [editedSkills, setEditedSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [newCert, setNewCert] = useState("");

  React.useEffect(() => {
    if (employeeSkills.length > 0) {
      setEditedSkills(employeeSkills.map(s => ({ ...s, _isExisting: true })));
    }
  }, [employeeSkills]);

  const saveSkillsMutation = useMutation({
    mutationFn: async (skills) => {
      const promises = skills.map(skill => {
        const data = {
          employee_id: employee.id,
          employee_name: employee.full_name,
          skill_id: skill.skill_id,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          proficiency_level: skill.proficiency_level,
          years_of_experience: skill.years_of_experience || undefined,
          notes: skill.notes || undefined,
          certifications: skill.certifications || [],
          is_primary: skill.is_primary || false,
          last_assessed_date: new Date().toISOString().split('T')[0],
          assessed_by: currentUser.id,
          assessed_by_name: currentUser.full_name,
        };

        if (skill._isExisting && skill.id) {
          return base44.entities.EmployeeSkill.update(skill.id, data);
        } else {
          return base44.entities.EmployeeSkill.create(data);
        }
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeSkills"] });
      onSave();
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id) => base44.entities.EmployeeSkill.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeSkills"] });
    },
  });

  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    
    const skill = companySkills.find(s => s.id === selectedSkillId);
    if (!skill) return;

    // Check if already added
    if (editedSkills.some(s => s.skill_id === selectedSkillId)) {
      alert("This skill is already added");
      return;
    }

    setEditedSkills([...editedSkills, {
      skill_id: skill.id,
      skill_name: skill.name,
      skill_category: skill.category,
      proficiency_level: "beginner",
      years_of_experience: 0,
      notes: "",
      certifications: [],
      is_primary: false,
    }]);
    setSelectedSkillId("");
  };

  const handleUpdateSkill = (index, field, value) => {
    const updated = [...editedSkills];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSkills(updated);
  };

  const handleRemoveSkill = (index) => {
    const skill = editedSkills[index];
    if (skill._isExisting && skill.id) {
      if (confirm("Remove this skill?")) {
        deleteSkillMutation.mutate(skill.id);
      }
    }
    setEditedSkills(editedSkills.filter((_, i) => i !== index));
  };

  const handleAddCertification = (index) => {
    if (!newCert.trim()) return;
    const updated = [...editedSkills];
    updated[index].certifications = [...(updated[index].certifications || []), newCert.trim()];
    setEditedSkills(updated);
    setNewCert("");
  };

  const handleRemoveCertification = (skillIndex, certIndex) => {
    const updated = [...editedSkills];
    updated[skillIndex].certifications = updated[skillIndex].certifications.filter((_, i) => i !== certIndex);
    setEditedSkills(updated);
  };

  const availableSkills = companySkills.filter(
    cs => !editedSkills.some(es => es.skill_id === cs.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a skill to add" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availableSkills.map(skill => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.name} ({skill.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAddSkill} disabled={!selectedSkillId}>
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {editedSkills.map((skill, index) => (
          <Card key={index} className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">{skill.skill_name}</h4>
                  <Badge variant="outline" className="mt-1">{skill.skill_category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSkill(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proficiency Level *</Label>
                  <Select
                    value={skill.proficiency_level}
                    onValueChange={(val) => handleUpdateSkill(index, "proficiency_level", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    value={skill.years_of_experience || ""}
                    onChange={(e) => handleUpdateSkill(index, "years_of_experience", parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={skill.notes || ""}
                  onChange={(e) => handleUpdateSkill(index, "notes", e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="mt-4 space-y-2">
                <Label>Certifications</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add certification..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCertification(index)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleAddCertification(index)}>
                    Add
                  </Button>
                </div>
                {skill.certifications && skill.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skill.certifications.map((cert, certIdx) => (
                      <Badge key={certIdx} variant="secondary" className="gap-1">
                        {cert}
                        <button
                          onClick={() => handleRemoveCertification(index, certIdx)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={skill.is_primary}
                    onCheckedChange={(checked) => handleUpdateSkill(index, "is_primary", checked)}
                  />
                  <span className="text-sm text-slate-700">Mark as primary skill</span>
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => saveSkillsMutation.mutate(editedSkills)}
          disabled={saveSkillsMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Skills
        </Button>
      </div>
    </div>
  );
}