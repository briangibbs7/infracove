import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Video, MapPin } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";

export default function UpcomingInterviews({ candidates }) {
  const upcomingInterviews = [];

  candidates.forEach(candidate => {
    if (candidate.interview_dates && candidate.interview_dates.length > 0) {
      candidate.interview_dates.forEach(interview => {
        const interviewDate = parseISO(interview.date);
        if (!isPast(interviewDate) || isToday(interviewDate)) {
          upcomingInterviews.push({
            ...interview,
            candidate_name: `${candidate.first_name} ${candidate.last_name}`,
            job_title: candidate.job_title,
            candidate_id: candidate.id,
            parsedDate: interviewDate
          });
        }
      });
    }
  });

  upcomingInterviews.sort((a, b) => a.parsedDate - b.parsedDate);

  const getTypeIcon = (type) => {
    if (type?.includes('video')) return <Video className="w-4 h-4" />;
    if (type?.includes('person')) return <MapPin className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    if (!type) return "Interview";
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDateBadge = (date) => {
    if (isToday(date)) return <Badge className="bg-green-100 text-green-700">Today</Badge>;
    if (isTomorrow(date)) return <Badge className="bg-blue-100 text-blue-700">Tomorrow</Badge>;
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Upcoming Interviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingInterviews.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No upcoming interviews scheduled</p>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.slice(0, 5).map((interview, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{interview.candidate_name}</h4>
                      {getDateBadge(interview.parsedDate)}
                    </div>
                    <p className="text-xs text-slate-600">{interview.job_title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(interview.type)}
                    <span>{getTypeLabel(interview.type)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(interview.parsedDate, 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(interview.parsedDate, 'MMM d, yyyy')}</span>
                  </div>
                  {interview.interviewer && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{interview.interviewer}</span>
                    </div>
                  )}
                </div>

                {interview.location && (
                  <p className="text-xs text-slate-600 mt-2 truncate">
                    📍 {interview.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}