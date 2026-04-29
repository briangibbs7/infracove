import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SkillsInput({ skills = [], onSkillsChange, disabled = false }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const commonSkills = [
    "JavaScript", "Python", "React", "Node.js", "TypeScript", "SQL", "Java", "C++",
    "Project Management", "Leadership", "Communication", "Data Analysis", "UI/UX Design",
    "Product Management", "Agile", "AWS", "DevOps", "Machine Learning", "Cloud Architecture",
    "HR Management", "Recruitment", "Financial Analysis", "Business Development"
  ];

  const handleInputChange = (value) => {
    setInput(value);
    if (value.trim()) {
      const filtered = commonSkills.filter(s => 
        s.toLowerCase().includes(value.toLowerCase()) && 
        !skills.includes(s)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onSkillsChange([...skills, trimmed]);
      setInput("");
      setSuggestions([]);
    }
  };

  const removeSkill = (skillToRemove) => {
    onSkillsChange(skills.filter(s => s !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        addSkill(input);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill (e.g., JavaScript)"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            onClick={() => addSkill(input)}
            disabled={!input.trim() || disabled}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {suggestions.map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="flex items-center gap-1.5 pl-3 pr-1.5 py-1"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                disabled={disabled}
                className="hover:text-slate-700 disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}