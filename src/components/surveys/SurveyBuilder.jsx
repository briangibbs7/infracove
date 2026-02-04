import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function SurveyBuilder({ initialSurvey, onSave, isLoading }) {
  const [survey, setSurvey] = useState(
    initialSurvey || {
      title: "",
      description: "",
      type: "custom",
      status: "draft",
      department: "all",
      questions: [],
      allow_anonymous: false,
    }
  );

  const addQuestion = () => {
    setSurvey({
      ...survey,
      questions: [
        ...survey.questions,
        {
          id: generateId(),
          question_text: "",
          question_type: "text",
          is_required: true,
          options: [],
          order: survey.questions.length,
        },
      ],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setSurvey({ ...survey, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter((_, i) => i !== index),
    });
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...survey.questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options.push("");
    setSurvey({ ...survey, questions: updatedQuestions });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setSurvey({ ...survey, questions: updatedQuestions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...survey.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    setSurvey({ ...survey, questions: updatedQuestions });
  };

  const needsOptions = (type) =>
    ["multiple_choice", "checkbox", "ranking"].includes(type);

  return (
    <div className="space-y-6">
      {/* Survey Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Survey Title *</Label>
              <Input
                value={survey.title}
                onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                placeholder="e.g., Q1 2026 Employee Feedback"
              />
            </div>
            <div className="space-y-2">
              <Label>Survey Type</Label>
              <Select value={survey.type} onValueChange={(type) => setSurvey({ ...survey, type })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="all_hands">After All Hands Meeting</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={survey.description}
              onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
              placeholder="Add a description to help recipients understand the survey purpose"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={survey.department} onValueChange={(dept) => setSurvey({ ...survey, department: dept })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={survey.allow_anonymous}
                  onCheckedChange={(checked) =>
                    setSurvey({ ...survey, allow_anonymous: checked })
                  }
                />
                <Label htmlFor="anonymous" className="text-sm">Allow anonymous responses</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Questions ({survey.questions.length})</CardTitle>
            <Button onClick={addQuestion} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {survey.questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No questions yet. Click "Add Question" to get started.
            </p>
          ) : (
            survey.questions.map((question, index) => (
              <div key={question.id} className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-400 mt-2" />
                    <div className="flex-1">
                      <Label className="text-sm font-semibold">
                        Question {index + 1}
                      </Label>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeQuestion(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  value={question.question_text}
                  onChange={(e) =>
                    updateQuestion(index, "question_text", e.target.value)
                  }
                  placeholder="Enter your question"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(type) =>
                        updateQuestion(index, "question_type", type)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="rating">Rating (1-5)</SelectItem>
                        <SelectItem value="multiple_choice">
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="ranking">Ranking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Checkbox
                      id={`required-${index}`}
                      checked={question.is_required}
                      onCheckedChange={(checked) =>
                        updateQuestion(index, "is_required", checked)
                      }
                    />
                    <Label htmlFor={`required-${index}`} className="text-sm">
                      Required
                    </Label>
                  </div>
                </div>

                {needsOptions(question.question_type) && (
                  <div className="space-y-2">
                    <Label className="text-sm">Options</Label>
                    <div className="space-y-2">
                      {(question.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(index, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <Button
                            onClick={() => removeOption(index, optIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => addOption(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => onSave(survey)}
        disabled={isLoading || !survey.title}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading ? "Saving..." : "Save Survey"}
      </Button>
    </div>
  );
}