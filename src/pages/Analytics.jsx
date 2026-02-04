import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import SkillsAnalytics from "@/components/analytics/SkillsAnalytics";
import RecognitionAnalytics from "@/components/analytics/RecognitionAnalytics";
import TrainingAnalytics from "@/components/analytics/TrainingAnalytics";
import TimeOffAnalytics from "@/components/analytics/TimeOffAnalytics";
import PerformanceAnalytics from "@/components/analytics/PerformanceAnalytics";
import { TrendingUp, Award, GraduationCap, Calendar, Target, Users } from "lucide-react";

export default function Analytics() {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: employeeSkills = [] } = useQuery({
    queryKey: ["employeeSkills"],
    queryFn: () => base44.entities.EmployeeSkill.list(),
  });

  const { data: companySkills = [] } = useQuery({
    queryKey: ["companySkills"],
    queryFn: () => base44.entities.CompanySkill.list(),
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ["recognitions"],
    queryFn: () => base44.entities.Recognition.list(),
  });

  const { data: employeePoints = [] } = useQuery({
    queryKey: ["employeePoints"],
    queryFn: () => base44.entities.EmployeePoints.list(),
  });

  const { data: trainingCourses = [] } = useQuery({
    queryKey: ["trainingCourses"],
    queryFn: () => base44.entities.TrainingCourse.list(),
  });

  const { data: trainingAssignments = [] } = useQuery({
    queryKey: ["trainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list(),
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => base44.entities.TimeOffRequest.list(),
  });

  const { data: performanceReviews = [] } = useQuery({
    queryKey: ["performanceReviews"],
    queryFn: () => base44.entities.PerformanceReview.list(),
  });

  const { data: performanceGoals = [] } = useQuery({
    queryKey: ["performanceGoals"],
    queryFn: () => base44.entities.PerformanceGoal.list(),
  });

  return (
    <div>
      <PageHeader
        title="HR Analytics"
        subtitle="Data-driven insights for workforce management and engagement"
      />

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="recognition" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Recognition</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Training</span>
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Time Off</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <SkillsAnalytics
            employees={employees}
            employeeSkills={employeeSkills}
            companySkills={companySkills}
          />
        </TabsContent>

        <TabsContent value="recognition">
          <RecognitionAnalytics
            recognitions={recognitions}
            employeePoints={employeePoints}
          />
        </TabsContent>

        <TabsContent value="training">
          <TrainingAnalytics
            trainingCourses={trainingCourses}
            trainingAssignments={trainingAssignments}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="timeoff">
          <TimeOffAnalytics
            timeOffRequests={timeOffRequests}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAnalytics
            performanceReviews={performanceReviews}
            performanceGoals={performanceGoals}
            employees={employees}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}