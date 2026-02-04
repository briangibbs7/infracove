import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, Trash2, Loader2 } from "lucide-react";

export default function MaterialUploader({ materials, onMaterialsChange }) {
  const [uploading, setUploading] = useState(false);

  const handleAddMaterial = () => {
    onMaterialsChange([...materials, { title: "", type: "document", file_url: "", order: materials.length }]);
  };

  const handleUpdateMaterial = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;
    onMaterialsChange(updated);
  };

  const handleRemoveMaterial = (index) => {
    onMaterialsChange(materials.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (index, file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleUpdateMaterial(index, "file_url", file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Training Materials</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial}>
          <Upload className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No materials yet. Click "Add Material" to get started.</p>
        </div>
      ) : (
        materials.map((material, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Material title"
                  value={material.title}
                  onChange={(e) => handleUpdateMaterial(index, "title", e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={material.type}
                    onValueChange={(value) => handleUpdateMaterial(index, "type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>

                  {material.type !== "link" ? (
                    <div className="relative">
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileUpload(index, file);
                        }}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      {uploading && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder="https://..."
                      value={material.file_url}
                      onChange={(e) => handleUpdateMaterial(index, "file_url", e.target.value)}
                    />
                  )}
                </div>

                {material.file_url && (
                  <div className="text-xs text-slate-600 break-all">
                    📎 {material.file_url}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMaterial(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}