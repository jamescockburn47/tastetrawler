'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onUpload: (urls: string[]) => void;
  existingPhotos?: string[];
}

export function PhotoUpload({ onUpload, existingPhotos = [] }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos', file));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { urls } = await res.json();

    const updated = [...photos, ...urls];
    setPhotos(updated);
    onUpload(updated);
    setUploading(false);
  }, [photos, onUpload]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <label className="flex items-center justify-center w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50 transition-colors">
          <span className="text-muted-foreground text-lg">+</span>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
    </div>
  );
}
