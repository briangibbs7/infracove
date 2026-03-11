import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Documentation() {
  const markdownContent = `# InfraCove - Enterprise HR Management Platform

## Overview
InfraCove is a comprehensive enterprise HR management system built on Base44. It provides end-to-end employee lifecycle management, from hiring to offboarding, with robust features for compliance, payroll, benefits, equity management, and more.

## Features

### Core HR Modules
- **Employee Management** - Complete employee directory with profiles, org charts, and department management
- **Hiring & Recruitment** - Job openings, candidate tracking, interview scheduling, and resume analysis
- **Onboarding** - Automated onboarding workflows, task management, and document collection
- **Offboarding** - Structured exit processes and exit interviews
- **Time Off Management** - Leave requests, approvals, and balance tracking
- **Performance Management** - Reviews, 360 feedback, goal tracking, and continuous feedback
- **Training & Development** - Course management, assignments, and completion tracking
- **Career Pathing** - Career progression planning and skill development

### Benefits & Compensation
- **Benefits Management** - Enrollment, claims processing, and plan management
- **Payroll** - Payroll processing, payslip generation, tax calculations, and analytics
- **Direct Deposit** - Banking information management
- **Tax Documents** - W-2/1099 management
- **Open Enrollment** - Annual benefits enrollment workflows

### Equity & Finance
- **Equity Management** - Stock options, RSUs, vesting schedules, and cap table
- **409A Valuations** - Valuation tracking and compliance
- **Funding Rounds** - Investment tracking and shareholder management
- **Board Consents** - Electronic voting and approval workflows
- **QSBS Tracking** - Qualified Small Business Stock compliance
- **Secondary Transactions** - Share transfer management

### Compliance & Legal
- **Export Control Compliance** - ITAR/EAR tracking and deemed export management
- **Compliance Training** - Course creation, assignments, and tracking
- **Technology Control Plans** - Controlled technology access management
- **Security Clearances** - Clearance level tracking and expiration management
- **NDAs** - NDA generation, e-signatures via DocuSign, and lifecycle management
- **Contract Management** - Employment contracts and legal agreements

### IT & Assets
- **Asset Management** - Hardware/software inventory and assignment tracking
- **Asset Requests** - Employee equipment requests and approval workflows
- **License Management** - Software license tracking
- **Asset Depreciation** - Depreciation calculations and reporting

### Communication & Collaboration
- **Announcements** - Company-wide and department-specific communications
- **Recognition & Rewards** - Peer recognition, points system, and leaderboards
- **Internal Messaging** - One-on-one and group chat
- **Notifications** - Real-time notification center
- **Surveys** - Employee surveys and feedback collection

### Advanced Features
- **AI Assistant** - HR AI chatbot for employee questions and policy guidance
- **Analytics Dashboard** - Comprehensive metrics and visualizations
- **Document Management** - Centralized document repository with OCR
- **Skills Matrix** - Organization-wide skills inventory and gap analysis
- **Mentorship Programs** - Mentor-mentee matching and tracking
- **Internship Programs** - Internship management and evaluation

## Technical Architecture

### Entities (35 total)
Key entities include: Employee, Department, TimeOffRequest, Payroll, Benefit, BenefitEnrollment, EquityGrant, Shareholder, ComplianceTraining, CompliancePersonnel, DeemedExport, TechnologyControlPlan, JobOpening, JobCandidate, Recognition, EmployeePoints, Asset, Contract, Announcement, Survey, ChatMessage, Notification, and more.

### Backend Functions (30+ functions)
- Payroll calculations and tax computations
- Equity vesting calculations and reporting
- Compliance risk scoring and deemed export flagging
- DocuSign integration for electronic signatures
- NDA generation and lifecycle management
- Resume analysis via AI (OpenAI integration)
- Email notifications
- Document OCR processing
- Onboarding automation workflows
- HRIS data synchronization

### Key Integrations
- **DocuSign** - Electronic signature workflows
- **OpenAI** - Resume analysis and AI assistance
- **Base44 Core** - Email, file uploads, LLM invocations

### UI/UX Features
- Role-based access control (Admin, Manager, Employee views)
- Responsive design (mobile-friendly)
- Real-time updates via subscriptions
- Interactive charts and analytics (Recharts)
- Drag-and-drop interfaces
- Advanced filtering and search
- Export capabilities (CSV, PDF)
- Tabbed interfaces for complex modules

## User Roles & Permissions

### Admin
- Full access to all modules
- Employee management and data modification
- System configuration
- Analytics and reporting

### Manager
- View direct reports
- Approve time off requests
- Performance review access
- Team analytics

### Employee
- Personal profile management
- View own data and documents
- Submit requests (time off, expenses)
- Participate in training and surveys
- Access benefits portal

### Department-Specific Access
- **HR Department** - People module access
- **Finance Department** - Finance and payroll access
- **Legal Department** - Legal and contracts access
- **IT Department** - Asset management access

## Setup Instructions

### Prerequisites
- Base44 account
- Node.js environment (handled by Base44)

### Installation Steps
1. Create a new Base44 app
2. Import all entity schemas from entities/ folder
3. Import all page files from pages/ folder
4. Import all component files from components/ folder
5. Import backend functions from functions/ folder
6. Configure environment variables for integrations

### Required Environment Variables
\`\`\`
OPENAI_API_KEY - For AI resume analysis
DOCUSIGN_INTEGRATION_KEY - For e-signature workflows
DOCUSIGN_USER_ID - DocuSign user identifier
\`\`\`

### Post-Installation Configuration
1. Create initial admin user via User entity
2. Set up departments via Department entity
3. Configure benefit plans
4. Create initial employees
5. Set up compliance programs if needed

## Module Dependencies

### Critical Path Modules
1. **Employee** entity must be created first
2. **Department** entity for organizational structure
3. Authentication configured via Base44's built-in system

### Optional Modules
All other modules can be enabled/disabled based on organizational needs.

## Customization Guide

### Adding Custom Fields to Employee
Edit entities/Employee.json to add new properties

### Creating Custom Workflows
Use backend functions to create automated workflows triggered by entity events.

### Modifying UI Themes
Edit Layout.js to customize navigation colors and branding

## Quick Start Checklist
- [ ] Import all entities
- [ ] Import pages and components
- [ ] Import backend functions
- [ ] Set environment variables
- [ ] Create admin user
- [ ] Set up departments
- [ ] Add initial employees
- [ ] Configure benefits
- [ ] Test core workflows
- [ ] Launch!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownContent);
    toast.success("Documentation copied to clipboard!");
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "InfraCove-Documentation.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documentation downloaded!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">App Documentation</h1>
          <p className="text-slate-500 mt-1">Complete guide to InfraCove HR Platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button onClick={downloadMarkdown} className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            Download MD
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>README.md Content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-50 p-6 rounded-lg overflow-auto text-xs font-mono whitespace-pre-wrap max-h-[70vh]">
            {markdownContent}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Structure Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Entities (35 files)</h3>
            <p className="text-sm text-slate-600">
              Employee, Department, Payroll, Benefit, BenefitEnrollment, TimeOffRequest, 
              EquityGrant, Shareholder, ComplianceTraining, Asset, Contract, JobOpening, 
              Recognition, and more...
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Pages (40+ files)</h3>
            <p className="text-sm text-slate-600">
              Dashboard, Employees, Payroll, Benefits, Compliance, EquityManagement, 
              Hiring, Onboarding, TimeOff, Performance, and more...
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Components (80+ files)</h3>
            <p className="text-sm text-slate-600">
              UI components, specialized forms, dialogs, analytics cards, and feature modules
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Backend Functions (30+ files)</h3>
            <p className="text-sm text-slate-600">
              Payroll processing, vesting calculations, DocuSign integration, AI analysis, 
              email notifications, and automation workflows
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}