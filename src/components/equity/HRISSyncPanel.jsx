import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { RefreshCw, CheckCircle, AlertCircle, Users, Award } from "lucide-react";

export default function HRISSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async (provider, syncType) => {
    setSyncing(true);
    try {
      const { data } = await base44.functions.invoke('syncHRISData', {
        provider,
        sync_type: syncType
      });

      if (data.success) {
        setLastSync({
          provider,
          timestamp: new Date(),
          employees_synced: data.employees_synced,
          grants_synced: data.grants_synced,
          errors: data.errors
        });

        toast.success(
          `Synced ${data.employees_synced} employees${data.grants_synced > 0 ? ` and ${data.grants_synced} grants` : ''} from ${provider}`
        );

        if (data.errors.length > 0) {
          console.warn('Sync errors:', data.errors);
          toast.error(`${data.errors.length} errors occurred during sync`);
        }
      } else {
        toast.error(data.message || 'Sync failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to sync HRIS data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gusto Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gusto</CardTitle>
              <Badge variant="outline">HRIS/Payroll</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sync employee data and equity grants from Gusto payroll system.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => handleSync('gusto', 'employees')} 
                disabled={syncing}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Sync Employees
              </Button>
              <Button 
                onClick={() => handleSync('gusto', 'equity')} 
                disabled={syncing}
                variant="outline"
                className="w-full justify-start"
              >
                <Award className="w-4 h-4 mr-2" />
                Sync Equity Grants
              </Button>
              <Button 
                onClick={() => handleSync('gusto', 'all')} 
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rippling Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Rippling</CardTitle>
              <Badge variant="outline">HRIS/Payroll</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sync employee data from Rippling workforce management platform.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => handleSync('rippling', 'employees')} 
                disabled={syncing}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Sync Employees
              </Button>
              <Button 
                onClick={() => handleSync('rippling', 'all')} 
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Status */}
      {lastSync && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Last Sync Successful</h3>
                <p className="text-sm text-green-700 mt-1">
                  {lastSync.provider.charAt(0).toUpperCase() + lastSync.provider.slice(1)} - {lastSync.timestamp.toLocaleString()}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-green-700">
                  <span>{lastSync.employees_synced} employees synced</span>
                  {lastSync.grants_synced > 0 && (
                    <span>{lastSync.grants_synced} grants synced</span>
                  )}
                </div>
                {lastSync.errors.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>{lastSync.errors.length} warnings (check console)</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Required</h3>
          <p className="text-sm text-blue-700">
            To enable HRIS integration, configure API keys in Settings → Environment Variables:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
            <li><code className="bg-blue-100 px-1 rounded">GUSTO_API_KEY</code> - From Gusto Developer Portal</li>
            <li><code className="bg-blue-100 px-1 rounded">RIPPLING_API_KEY</code> - From Rippling Settings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}