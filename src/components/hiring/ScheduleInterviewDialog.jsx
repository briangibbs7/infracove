import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Video, MapPin } from "lucide-react";

const INTERVIEW_TYPES = [
  { value: "phone_screen", label: "Phone Screen" },
  { value: "video_interview", label: "Video Interview" },
  { value: "in_person", label: "In-Person Interview" },
  { value: "technical_assessment", label: "Technical Assessment" },
  { value: "panel_interview", label: "Panel Interview" },
  { value: "final_interview", label: "Final Interview" }
];

export default function ScheduleInterviewDialog({ isOpen, onClose, candidate }) {
  const [formData, setFormData] = useState({
    date: null,
    time: "",
    type: "video_interview",
    interviewer: "",
    location: "",
    notes: "",
    send_invitation: true
  });
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: null,
        time: "",
        type: "video_interview",
        interviewer: "",
        location: "",
        notes: "",
        send_invitation: true
      });
    }
  }, [isOpen]);

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      const dateTime = new Date(`${format(data.date, 'yyyy-MM-dd')}T${data.time}`);
      
      const newInterview = {
        date: dateTime.toISOString(),
        type: data.type,
        interviewer: data.interviewer,
        location: data.location,
        notes: data.notes
      };

      const updatedInterviews = [...(candidate.interview_dates || []), newInterview];

      await base44.entities.JobCandidate.update(candidate.id, {
        interview_dates: updatedInterviews,
        status: data.type === "phone_screen" ? "phone_screen_scheduled" : "interview_scheduled"
      });

      if (data.send_invitation) {
        await base44.functions.invoke('sendInterviewInvitation', {
          candidate_id: candidate.id,
          interview_date: dateTime.toISOString(),
          interview_type: data.type,
          interviewer: data.interviewer,
          location: data.location
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    scheduleMutation.mutate(formData);
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <p className="text-sm text-slate-600">
            {candidate.first_name} {candidate.last_name} - {candidate.job_title}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Interview Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Interviewer *</Label>
            <Select value={formData.interviewer} onValueChange={(value) => setFormData({ ...formData, interviewer: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select interviewer..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.full_name}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {formData.type === "video_interview" && (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" /> Meeting Link
                </span>
              )}
              {formData.type === "in_person" && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </span>
              )}
              {!["video_interview", "in_person"].includes(formData.type) && "Location/Link"}
            </Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={
                formData.type === "video_interview" 
                  ? "https://zoom.us/..." 
                  : formData.type === "in_person"
                    ? "Office address or room"
                    : "Location or link"
              }
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional information for the interview..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="send_invitation"
              checked={formData.send_invitation}
              onChange={(e) => setFormData({ ...formData, send_invitation: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="send_invitation" className="cursor-pointer">
              Send email invitation to candidate
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={scheduleMutation.isPending || !formData.date || !formData.time || !formData.interviewer}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Interview"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}