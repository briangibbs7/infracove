import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Download, Copy, Check } from "lucide-react";

export default function NDAGenerator({ onComplete }) {
  const [formData, setFormData] = useState({
    partyName: "",
    companyName: "OpsHub Inc.",
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    confidentialInfo: "",
    specialTerms: ""
  });
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const response = await base44.functions.invoke('generateNDA', formData);
      setGeneratedContent(response.data.content);
    } catch (error) {
      alert("Failed to generate NDA: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDA-${formData.partyName.replace(/\s+/g, '_')}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUseGenerated = () => {
    onComplete({
      content: generatedContent,
      metadata: formData
    });
  };

  if (generatedContent) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Check className="w-5 h-5" />
            <h4 className="font-semibold">NDA Generated Successfully</h4>
          </div>
          <p className="text-sm text-emerald-600">
            Review the generated document below and download or copy it as needed.
          </p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
              {generatedContent}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setGeneratedContent(null)}
            className="flex-1"
          >
            Generate Another
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            type="button"
            onClick={handleUseGenerated}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Use This NDA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      <div className="bg-indigo-50 p-4 rounded-lg flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-indigo-900 mb-1">AI-Powered NDA Generation</h4>
          <p className="text-sm text-indigo-700">
            Provide the key details and our AI will generate a professional, legally-formatted NDA document.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Your Company Name *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            placeholder="OpsHub Inc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="partyName">Other Party Name *</Label>
          <Input
            id="partyName"
            value={formData.partyName}
            onChange={(e) => setFormData({...formData, partyName: e.target.value})}
            placeholder="External company or individual"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="effectiveDate">Effective Date *</Label>
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confidentialInfo">Confidential Information Scope (optional)</Label>
        <Textarea
          id="confidentialInfo"
          value={formData.confidentialInfo}
          onChange={(e) => setFormData({...formData, confidentialInfo: e.target.value})}
          placeholder="Describe what specific information should be considered confidential..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialTerms">Special Terms or Provisions (optional)</Label>
        <Textarea
          id="specialTerms"
          value={formData.specialTerms}
          onChange={(e) => setFormData({...formData, specialTerms: e.target.value})}
          placeholder="Any special terms, exclusions, or provisions to include..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={generating}
      >
        {generating ? (
          <>
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Generating NDA...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate NDA with AI
          </>
        )}
      </Button>
    </form>
  );
}