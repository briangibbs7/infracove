import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  Target,
  Users,
  TrendingUp,
  BarChart3,
  X,
} from "lucide-react";

const skillIcons = {
  strategic: <Target className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  seo: <TrendingUp className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
  campaign: <Award className="w-5 h-5" />,
  marketing: <Briefcase className="w-5 h-5" />,
};

export default function EnhancedProfileModal({ employee, onClose }) {
  if (!employee) return null;

  // Mock achievements - in real app would come from data
  const achievements = [
    { icon: "🎯", title: "Increased social media engagement", subtitle: "by 200% in one year." },
    { icon: "💰", title: "Managed a $1M ad budget across", subtitle: "multiple platforms." },
    { icon: "🏆", title: 'Won "Best Marketing Campaign"', subtitle: "award in 2024." },
  ];

  // Mock career highlights - in real app would come from data
  const careerHighlights = [
    {
      years: "2015–2018",
      title: "Content Strategist",
      company: "BrandPro",
    },
    {
      years: "2018–2022",
      title: "Marketing Manager",
      company: "ABC Agency",
    },
    {
      years: "2022–Present",
      title: "Senior Marketing Specialist",
      company: "XYZ Corp",
    },
  ];

  // Mock skills - in real app would come from data
  const skills = [
    {
      name: "Strategic Campaign Planning",
      desc: "Creating goal-driven marketing campaigns.",
      icon: "campaign",
    },
    {
      name: "Social Media Management",
      desc: "Growing and engaging online audiences.",
      icon: "social",
    },
    {
      name: "SEO & Content Marketing",
      desc: "Boosting visibility through optimized content.",
      icon: "seo",
    },
    {
      name: "Market Research & Analysis",
      desc: "Understanding trends and customer needs.",
      icon: "analytics",
    },
  ];

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 flex items-center justify-between">
          <div>
            <DialogTitle className="text-2xl">Employee Profile</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Photo */}
                <div className="w-32 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold flex-shrink-0">
                  {employee.profile_photo ? (
                    <img
                      src={employee.profile_photo}
                      alt={employee.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    employee.full_name?.charAt(0) || "E"
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-slate-900 mb-1">
                    {employee.full_name}
                  </h1>
                  <p className="text-lg text-indigo-600 font-semibold mb-4">
                    {employee.job_title}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {employee.bio ||
                      "Professional with extensive experience in their field."}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b-2 border-indigo-600 inline-block">
                Professional Summary
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {employee.bio ||
                  "Expert professional with proven track record of delivering results across multiple domains."}
              </p>
            </div>

            {/* Key Skills */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-indigo-600 inline-block">
                Key Skills
              </h2>
              <div className="space-y-4">
                {(employee.skills && employee.skills.length > 0
                  ? employee.skills.slice(0, 4).map((skill, idx) => ({
                      name: skill,
                      desc: "Professional expertise",
                      icon: Object.keys(skillIcons)[idx % Object.keys(skillIcons).length],
                    }))
                  : skills
                ).map((skill, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      {skillIcons[skill.icon] || skillIcons.strategic}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {skill.name}
                      </p>
                      <p className="text-xs text-slate-500">{skill.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {/* Achievements */}
            <div>
              <h3 className="text-base font-bold text-indigo-600 mb-4">
                Achievements
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {achievement.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Highlights */}
            <div>
              <h3 className="text-base font-bold text-indigo-600 mb-4">
                Career Highlights
              </h3>
              <div className="space-y-4">
                {careerHighlights.map((highlight, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                      {idx < careerHighlights.length - 1 && (
                        <div className="w-0.5 h-12 bg-indigo-200 my-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        {highlight.years}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {highlight.title}
                      </p>
                      <p className="text-xs text-slate-500">{highlight.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Touch */}
            {(employee.interests && employee.interests.length > 0) && (
              <div>
                <h3 className="text-base font-bold text-indigo-600 mb-3">
                  Personal Touch
                </h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  {employee.interests.map((interest, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-indigo-600">✓</span>
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Details */}
            <div>
              <h3 className="text-base font-bold text-indigo-600 mb-3">
                Contact Details
              </h3>
              <div className="space-y-2.5">
                {employee.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-slate-700 hover:text-indigo-600"
                    >
                      {employee.email}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <a
                      href={`tel:${employee.phone}`}
                      className="text-slate-700 hover:text-indigo-600"
                    >
                      {employee.phone}
                    </a>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700">{employee.location}</span>
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700">{employee.department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}