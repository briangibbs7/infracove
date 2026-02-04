import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import GiveRecognitionDialog from "@/components/recognition/GiveRecognitionDialog";
import RecognitionFeed from "@/components/recognition/RecognitionFeed";
import PointsLeaderboard from "@/components/recognition/PointsLeaderboard";
import { Award, Users, Trophy } from "lucide-react";

export default function Recognition() {
  const [user, setUser] = useState(null);
  const [isGiveRecognitionOpen, setIsGiveRecognitionOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: recognitions = [] } = useQuery({
    queryKey: ["recognitions"],
    queryFn: () => base44.entities.Recognition.list("-created_date"),
  });

  const { data: employeePoints = [] } = useQuery({
    queryKey: ["employeePoints"],
    queryFn: () => base44.entities.EmployeePoints.list(),
  });

  const filteredRecognitions = recognitions.filter(r => {
    if (!r.is_public) return false;
    if (typeFilter === "all") return true;
    return r.type === typeFilter;
  });

  const currentEmployee = user ? employees.find(e => e.email === user.email) : null;
  const myRecognitions = currentEmployee 
    ? recognitions.filter(r => r.recipient_id === currentEmployee.id)
    : [];
  
  const myPoints = currentEmployee
    ? employeePoints.find(ep => ep.employee_id === currentEmployee.id)
    : null;

  return (
    <div>
      <PageHeader
        title="Recognition & Rewards"
        subtitle={`Celebrate achievements and milestones`}
      >
        <Button
          onClick={() => {
            const emp = employees.find(e => e.status === "active");
            if (emp) {
              setSelectedEmployee(emp);
              setIsGiveRecognitionOpen(true);
            } else {
              alert("No active employees to recognize");
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Award className="w-4 h-4 mr-2" />
          Give Recognition
        </Button>
      </PageHeader>

      {currentEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Total Points</p>
                  <p className="text-3xl font-bold text-amber-900 mt-1">
                    {myPoints?.total_points || 0}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-700 font-medium">This Month</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-1">
                    {myPoints?.points_this_month || 0}
                  </p>
                </div>
                <Award className="w-10 h-10 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Recognitions</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {myRecognitions.length}
                  </p>
                </div>
                <Users className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Rank</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1 capitalize">
                    {myPoints?.rank || "Bronze"}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Level {myPoints?.level || 1}</p>
                </div>
                <Trophy className="w-10 h-10 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Recognition Feed</h2>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="kudos">Kudos</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="skill_milestone">Skill Milestone</SelectItem>
                    <SelectItem value="training_completion">Training</SelectItem>
                    <SelectItem value="project_success">Project Success</SelectItem>
                    <SelectItem value="peer_recognition">Peer Recognition</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <RecognitionFeed
                recognitions={filteredRecognitions}
                currentUser={user}
                employees={employees}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <PointsLeaderboard
            employeePoints={employeePoints}
            employees={employees}
          />
        </div>
      </div>

      {selectedEmployee && user && (
        <GiveRecognitionDialog
          isOpen={isGiveRecognitionOpen}
          onClose={() => {
            setIsGiveRecognitionOpen(false);
            setSelectedEmployee(null);
          }}
          recipient={selectedEmployee}
          currentUser={user}
        />
      )}
    </div>
  );
}