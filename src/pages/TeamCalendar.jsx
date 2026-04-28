import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, isWithinInterval, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_COLORS = {
  vacation:    "bg-blue-500",
  sick:        "bg-red-400",
  personal:    "bg-purple-500",
  bereavement: "bg-gray-500",
  parental:    "bg-pink-500",
  other:       "bg-orange-400",
};

const TYPE_LABELS = {
  vacation:    "Vacation",
  sick:        "Sick",
  personal:    "Personal",
  bereavement: "Bereavement",
  parental:    "Parental",
  other:       "Other",
};

export default function TeamCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["timeoff-approved"],
    queryFn: () => base44.entities.TimeOffRequest.filter({ status: "approved" }),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start on Sunday
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(days);

  function getRequestsForDay(day) {
    return requests.filter((r) => {
      try {
        const start = parseISO(r.start_date);
        const end = parseISO(r.end_date);
        return isWithinInterval(day, { start, end });
      } catch {
        return false;
      }
    });
  }

  const selectedDayRequests = selectedDay ? getRequestsForDay(selectedDay) : [];

  // Upcoming time-off in the next 30 days from today
  const today = new Date();
  const upcomingRequests = requests
    .filter((r) => {
      try {
        const start = parseISO(r.start_date);
        return start >= today;
      } catch {
        return false;
      }
    })
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))
    .slice(0, 8);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">View approved team time-off at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span>{employees.length} employees</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {paddedDays.map((day, i) => {
                if (!day) {
                  return <div key={`pad-${i}`} className="bg-white min-h-[80px]" />;
                }

                const dayRequests = getRequestsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`bg-white min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                      isSelected ? "ring-2 ring-inset ring-blue-500" : ""
                    }`}
                  >
                    <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                      isCurrentDay
                        ? "bg-blue-600 text-white"
                        : "text-slate-700"
                    }`}>
                      {format(day, "d")}
                    </div>

                    <div className="space-y-0.5">
                      {dayRequests.slice(0, 3).map((r, idx) => (
                        <div
                          key={idx}
                          className={`text-white text-[10px] px-1 py-0.5 rounded truncate ${TYPE_COLORS[r.type] || "bg-slate-400"}`}
                          title={`${r.employee_name} – ${TYPE_LABELS[r.type]}`}
                        >
                          {r.employee_name?.split(" ")[0]}
                        </div>
                      ))}
                      {dayRequests.length > 3 && (
                        <div className="text-[10px] text-slate-500 px-1">
                          +{dayRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className={`w-3 h-3 rounded-sm ${TYPE_COLORS[key]}`} />
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day detail */}
          {selectedDay && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  {format(selectedDay, "EEEE, MMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayRequests.length === 0 ? (
                  <p className="text-sm text-slate-400">No one is out this day.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDayRequests.map((r, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[r.type] || "bg-slate-400"}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{r.employee_name}</p>
                          <p className="text-xs text-slate-500">{TYPE_LABELS[r.type]}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming time off */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Time Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRequests.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming approved requests.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingRequests.map((r, i) => (
                    <li key={i} className="border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                      <p className="text-sm font-medium text-slate-800">{r.employee_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(r.start_date), "MMM d")} – {format(parseISO(r.end_date), "MMM d")}
                      </p>
                      <Badge
                        className={`mt-1 text-[10px] text-white border-0 ${TYPE_COLORS[r.type] || "bg-slate-400"}`}
                      >
                        {TYPE_LABELS[r.type]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}