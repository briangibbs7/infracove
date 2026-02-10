import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BulkGrantImport({ isOpen, onClose, onSuccess, shareholders }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|xlsx)$/i)) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsProcessing(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from file
      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            grants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  shareholder_email: { type: "string" },
                  grant_type: { type: "string" },
                  shares_granted: { type: "number" },
                  strike_price: { type: "number" },
                  grant_date: { type: "string" },
                  vesting_start_date: { type: "string" },
                  vesting_schedule: { type: "string" },
                  vesting_period_months: { type: "number" },
                  cliff_months: { type: "number" },
                }
              }
            }
          }
        }
      });

      if (extractResponse.status === "error") {
        toast.error(extractResponse.details || "Failed to extract data from file");
        return;
      }

      const grantsData = extractResponse.output?.grants || extractResponse.output || [];
      
      if (!Array.isArray(grantsData) || grantsData.length === 0) {
        toast.error("No valid grant data found in file");
        return;
      }

      // Process and create grants
      const importResults = {
        total: grantsData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (const grantData of grantsData) {
        try {
          // Find shareholder by email
          const shareholder = shareholders.find(s => 
            s.email?.toLowerCase() === grantData.shareholder_email?.toLowerCase()
          );

          if (!shareholder) {
            importResults.failed++;
            importResults.errors.push(`Shareholder not found: ${grantData.shareholder_email}`);
            continue;
          }

          // Create grant
          await base44.entities.EquityGrant.create({
            shareholder_id: shareholder.id,
            shareholder_name: shareholder.name,
            grant_type: grantData.grant_type || "stock_options",
            shares_granted: grantData.shares_granted || 0,
            strike_price: grantData.strike_price || 0,
            grant_date: grantData.grant_date || new Date().toISOString().split("T")[0],
            vesting_start_date: grantData.vesting_start_date,
            vesting_schedule: grantData.vesting_schedule || "4_year_1_cliff",
            vesting_period_months: grantData.vesting_period_months || 48,
            cliff_months: grantData.cliff_months || 12,
            status: "active"
          });

          importResults.success++;
        } catch (error) {
          importResults.failed++;
          importResults.errors.push(`Error creating grant for ${grantData.shareholder_email}: ${error.message}`);
        }
      }

      setResults(importResults);
      
      if (importResults.success > 0) {
        toast.success(`Successfully imported ${importResults.success} grant(s)`);
        onSuccess?.();
      }
      
      if (importResults.failed > 0) {
        toast.error(`${importResults.failed} grant(s) failed to import`);
      }

    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `shareholder_email,grant_type,shares_granted,strike_price,grant_date,vesting_start_date,vesting_schedule,vesting_period_months,cliff_months
john@example.com,stock_options,10000,1.00,2024-01-15,2024-01-15,4_year_1_cliff,48,12
jane@example.com,rsu,5000,,2024-02-01,2024-02-01,4_year_monthly,48,0`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equity_grants_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Equity Grants</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use our CSV template to ensure your data is formatted correctly.
                </p>
                <Button size="sm" variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>Upload File (CSV or Excel)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-dashed rounded-lg appearance-none cursor-pointer hover:border-slate-400 focus:outline-none border-slate-300">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-slate-500">CSV or XLSX up to 10MB</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-900">Import Results</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-2xl font-bold text-slate-900">{results.total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-700">{results.success}</p>
                  <p className="text-xs text-green-600">Success</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-slate-700 mb-2">Errors:</p>
                  {results.errors.map((error, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-red-700 mb-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
            >
              {isProcessing ? "Processing..." : "Import Grants"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}