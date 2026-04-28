import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Phone, MapPin, Briefcase, Calendar, Shield,
  Building2, Globe, CreditCard, Star, BookOpen, Target
} from "lucide-react";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  on_leave: "bg-yellow-100 text-yellow-700",
};

const CLEARANCE_LABELS = {
  none: "None",
  confidential: "Confidential",
  secret: "Secret",
  top_secret: "Top Secret",
};

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-indigo-600 hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm text-slate-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b pb-1">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function EmployeeDetailModal({ employee, open, onClose }) {
  if (!employee) return null;

  const initials = employee.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Profile header */}
          <div className="flex items-center gap-4 pb-2">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={employee.profile_photo} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-900">{employee.full_name}</DialogTitle>
              {employee.job_title && <p className="text-sm text-slate-500 mt-0.5">{employee.job_title}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {employee.department && (
                  <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50">
                    {employee.department}
                  </Badge>
                )}
                {employee.status && (
                  <Badge className={`text-xs border-0 ${STATUS_COLORS[employee.status] || STATUS_COLORS.active}`}>
                    {employee.status.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Contact */}
          <Section title="Contact">
            <InfoRow icon={Mail} label="Email" value={employee.email} href={`mailto:${employee.email}`} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone} href={`tel:${employee.phone}`} />
            <InfoRow icon={MapPin} label="Location" value={employee.location} />
          </Section>

          {/* Employment */}
          <Section title="Employment">
            <InfoRow icon={Building2} label="Department" value={employee.department} />
            <InfoRow icon={Briefcase} label="Reports To" value={employee.manager_name} />
            <InfoRow icon={Calendar} label="Hire Date" value={employee.hire_date} />
            <InfoRow icon={Star} label="Role" value={employee.role} />
          </Section>

          {/* Skills & Bio */}
          {(employee.bio || (employee.skills?.length > 0) || employee.career_goals) && (
            <Section title="About">
              {employee.bio && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Bio</p>
                  <p className="text-sm text-slate-700">{employee.bio}</p>
                </div>
              )}
              {employee.career_goals && (
                <InfoRow icon={Target} label="Career Goals" value={employee.career_goals} />
              )}
              {employee.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.skills.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {employee.interests?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.interests.map(i => (
                      <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Compliance / Security */}
          {(employee.clearance_level && employee.clearance_level !== "none") || employee.visa_type || employee.citizenship ? (
            <Section title="Compliance & Security">
              <InfoRow icon={Globe} label="Citizenship" value={employee.citizenship} />
              <InfoRow icon={CreditCard} label="Visa Type" value={employee.visa_type} />
              {employee.visa_expiry && <InfoRow icon={Calendar} label="Visa Expiry" value={employee.visa_expiry} />}
              {employee.clearance_level && employee.clearance_level !== "none" && (
                <InfoRow icon={Shield} label="Clearance" value={CLEARANCE_LABELS[employee.clearance_level]} />
              )}
              {employee.export_control_training && (
                <InfoRow icon={BookOpen} label="Export Control Training" value={employee.training_date ? `Completed ${employee.training_date}` : "Completed"} />
              )}
            </Section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}