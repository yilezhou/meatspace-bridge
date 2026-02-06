import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EvidenceUploaderProps {
  taskId: string;
  onUploadComplete?: (url: string) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ taskId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setSuccess(false);
      const file = event.target.files?.[0];
      if (!file) return;

      // Show preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Math.random()}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('bounty_evidence')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('bounty_evidence')
        .getPublicUrl(filePath);

      setSuccess(true);
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
      <div className="flex flex-col items-center justify-center space-y-4">
        {previewUrl ? (
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-slate-100 rounded-full">
            <Camera className="w-12 h-12 text-slate-400" />
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Upload Evidence</h3>
          <p className="text-sm text-slate-500">Take a photo or select a file to prove task completion</p>
        </div>

        <label className={`
          flex items-center space-x-2 px-4 py-2 rounded-md font-medium cursor-pointer transition-colors
          ${uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
        `}>
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Select File'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Evidence uploaded successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
