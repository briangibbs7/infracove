import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExportGuide() {
  const [copied, setCopied] = useState(null);

  const copySection = (id) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sections = {
    entities: `## Step 1: Export Entities

1. Go to your Base44 dashboard
2. Navigate to Code > Entities
3. For each entity file (.json), copy the complete JSON schema
4. Create the same entity files in the new app's entities/ folder

Key entities to export:
- Employee
- Department
- Payroll
- Benefit
- BenefitEnrollment
- TimeOffRequest
- EquityGrant
- Shareholder
- ComplianceTraining
- CompliancePersonnel
- And all other 25+ entities

Tip: Export entities FIRST before pages, since pages depend on them.`,

    pages: `## Step 2: Export Pages

1. Go to Code > Pages in your dashboard
2. For each page (.js file), copy the entire content
3. Create matching .js files in the new app's pages/ folder
4. Paste the exact content

Key pages include:
- Dashboard
- Employees
- Payroll
- Hiring
- Benefits
- Compliance
- EquityManagement
- Onboarding
- Performance
- And 30+ more pages

Important: Page names must match EXACTLY or navigation will break.`,

    components: `## Step 3: Export Components

1. Go to Code > Components in your dashboard
2. Copy each component file (.jsx or .js)
3. Maintain the exact folder structure in the new app
4. Paste content into matching files

Examples of folder structure:
- components/ui/button.jsx
- components/ui/card.jsx
- components/ui/tabs.jsx
- components/employees/EmployeeProfileModal.jsx
- components/equity/VestingCalculator.jsx
- components/recognition/GiveRecognitionDialog.jsx
- And 80+ more components

Tip: Copy UI components from @/components/ui first, then feature components.`,

    functions: `## Step 4: Export Backend Functions

1. Go to Code > Functions in your dashboard
2. Copy each function file (.js)
3. Paste into matching files in the new app's functions/ folder

Key functions include:
- logEquityActivity.js
- calculateVesting.js
- generateVestingReport.js
- checkUpcomingVesting.js
- sendDocumentForSignature.js
- syncHRISData.js
- And 25+ more functions

Important: Function names must match exactly for automations to work.`,

    layout: `## Step 5: Export Layout & Configuration

1. Copy Layout.js from your app
2. Paste into the new app's Layout.js
3. Copy globals.css if you have custom styles
4. Paste into the new app's globals.css

These files control:
- Navigation menu structure
- Top header bar styling
- Theme colors
- Global CSS variables
- Sidebar organization`,

    secrets: `## Step 6: Configure Environment Variables & Secrets

In the new app's dashboard, go to Settings > Environment Variables and add:

OPENAI_API_KEY
- Used for: Resume analysis, AI assistant
- Get from: https://platform.openai.com/api-keys

DOCUSIGN_INTEGRATION_KEY
DOCUSIGN_USER_ID
- Used for: E-signature workflows
- Get from: DocuSign developer account

Note: These are sensitive - never commit to version control.`,

    automations: `## Step 7: Recreate Automations

1. Go to Settings > Automations in the new app
2. For each automation, create a new one with:
   - Same name
   - Same function name
   - Same schedule/triggers
   - Same event types (if entity automation)

Common automations to recreate:
- Scheduled payroll runs
- Vesting calculations
- Compliance training reminders
- Email notifications
- Onboarding workflows`,

    data: `## Step 8: Migrate Data (Optional)

After setting up the new app:

1. Export data from old app
   - Dashboard > Entities > Entity Name > Export
   - Select all records
   - Download as CSV/JSON

2. Import into new app
   - New app > Entities > Entity Name > Import
   - Upload CSV/JSON
   - Map fields if needed

Start with:
1. Departments (no dependencies)
2. Employees (depends on Department)
3. Other entities in dependency order

Tip: Test with a small subset first!`
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Export to Another Base44 App</h1>
        <p className="text-slate-500 mt-2">Complete guide to transferring InfraCove to a new Base44 instance</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">Quick Summary</h3>
        <p className="text-sm text-blue-800 mt-1">
          You need to manually copy all code files and recreate configurations in the new app. Base44 doesn't have automatic export, but the process is straightforward.
        </p>
      </div>

      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
        </TabsList>

        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {Object.entries(sections).map(([key, content]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{content.split('\n')[0].replace('## ', '')}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(content);
                      copySection(key);
                    }}
                  >
                    {copied === key ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap font-mono">
                  {content}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">File Naming</h4>
            <p className="text-slate-700">All file names must match EXACTLY, including capitalization. Pages especially must match the URL routes.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Import Order</h4>
            <p className="text-slate-700">Import entities FIRST, then pages/components, then functions. This prevents import errors from missing dependencies.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Test Thoroughly</h4>
            <p className="text-slate-700">After importing, test all major workflows before migrating production data.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Update References</h4>
            <p className="text-slate-700">Check all import paths in components and pages reference the correct entity names and components.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Data Migration</h4>
            <p className="text-slate-700">Migrating live data is optional. You can start fresh or use CSV import for bulk data.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Create new Base44 app
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Copy all entities (35 files)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Copy all pages (40+ files)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Copy all components (80+ files)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Copy Layout.js & globals.css
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Copy all backend functions (30+ files)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Set environment variables
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Recreate automations
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Test core workflows
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" /> Migrate data (optional)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle>Pro Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>• Use your browser's developer tools to copy large blocks of code efficiently</p>
          <p>• Keep both apps open side-by-side for easy copying</p>
          <p>• Start with a test entity to validate your process before copying everything</p>
          <p>• Document any customizations you've made - they need to be copied too</p>
          <p>• Save your current app URL for reference during migration</p>
        </CardContent>
      </Card>
    </div>
  );
}