import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  Award,
  Target,
  Globe,
  FileText,
  Heart,
  TrendingUp
} from "lucide-react";

export default function EmployeeProfileModal({ employee, open, onOpenChange }) {
  if (!employee) return null;

  const themeColors = {
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      badge: "bg-blue-100 text-blue-700",
    },
    purple: {
      gradient: "from-purple-500 to-pink-500",
      badge: "bg-purple-100 text-purple-700",
    },
    green: {
      gradient: "from-green-500 to-emerald-500",
      badge: "bg-green-100 text-green-700",
    },
    orange: {
      gradient: "from-orange-500 to-red-500",
      badge: "bg-orange-100 text-orange-700",
    },
    pink: {
      gradient: "from-pink-500 to-rose-500",
      badge: "bg-pink-100 text-pink-700",
    },
    slate: {
      gradient: "from-slate-500 to-gray-500",
      badge: "bg-slate-100 text-slate-700",
    },
  };

  const theme = themeColors[employee.profile_theme] || themeColors.blue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${theme.gradient} -m-6 mb-6 p-8 rounded-t-lg`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 text-white">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
              <AvatarImage src={employee.profile_photo} />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                {employee.full_name?.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-1">{employee.full_name}</h2>
              <p className="text-white/90 mb-2">{employee.job_title || "Employee"}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {employee.department && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {employee.department}
                  </Badge>
                )}
                {employee.status && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 capitalize">
                    {employee.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reporting Structure */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Reporting Structure
            </h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-600 mb-1">Reports To</p>
              <p className="text-base font-semibold text-indigo-900">
                {employee.manager_name || "Not assigned"}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employee.email && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium truncate">{employee.email}</p>
                  </div>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium">{employee.phone}</p>
                  </div>
                </div>
              )}
              {employee.location && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-medium">{employee.location}</p>
                  </div>
                </div>
              )}
              {employee.hire_date && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Hire Date</p>
                    <p className="text-sm font-medium">{new Date(employee.hire_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {employee.bio && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  About
                </h3>
                <p className="text-slate-700 leading-relaxed">{employee.bio}</p>
              </div>
            </>
          )}

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, idx) => (
                    <Badge key={idx} className={theme.badge}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Interests */}
          {employee.interests && employee.interests.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Interests & Hobbies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {employee.interests.map((interest, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-300">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Career Goals */}
          {employee.career_goals && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Career Goals
                </h3>
                <p className="text-slate-700 leading-relaxed">{employee.career_goals}</p>
              </div>
            </>
          )}

          {/* Leave Balances */}
          {(employee.vacation_balance || employee.sick_balance || employee.personal_balance) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Leave Balances
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {employee.vacation_balance !== undefined && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Vacation</p>
                      <p className="text-lg font-bold text-blue-900">{employee.vacation_balance} days</p>
                    </div>
                  )}
                  {employee.sick_balance !== undefined && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-600 mb-1">Sick</p>
                      <p className="text-lg font-bold text-red-900">{employee.sick_balance} days</p>
                    </div>
                  )}
                  {employee.personal_balance !== undefined && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 mb-1">Personal</p>
                      <p className="text-lg font-bold text-purple-900">{employee.personal_balance} days</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Compliance Information */}
          {(employee.citizenship || employee.visa_type || employee.clearance_level !== "none") && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Compliance & Security
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employee.citizenship && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Citizenship</p>
                        <p className="text-sm font-medium">{employee.citizenship}</p>
                      </div>
                    </div>
                  )}
                  {employee.visa_type && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Visa Type</p>
                        <p className="text-sm font-medium">{employee.visa_type}</p>
                      </div>
                    </div>
                  )}
                  {employee.clearance_level && employee.clearance_level !== "none" && (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="text-xs text-indigo-600">Security Clearance</p>
                        <p className="text-sm font-medium text-indigo-900 capitalize">{employee.clearance_level}</p>
                      </div>
                    </div>
                  )}
                  {employee.export_control_training && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Award className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600">Export Control Training</p>
                        <p className="text-sm font-medium text-green-900">Completed</p>
                        {employee.training_expiry && (
                          <p className="text-xs text-green-600 mt-1">
                            Expires: {new Date(employee.training_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}