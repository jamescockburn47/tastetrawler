'use client';

import { useCallback, useState } from 'react';

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

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('photos', file));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { urls } = await res.json();

      const updated = [...photos, ...urls];
      setPhotos(updated);
      onUpload(updated);
    } finally {
      setUploading(false);
    }
  }, [photos, onUpload]);

  return (
    <div className="kitsch-card-quiet space-y-3 rounded-[var(--radius-xl)] p-4">
      <p className="section-kicker">Photo evidence</p>
      <div className="flex gap-2 flex-wrap">
        {photos.map((url, i) => (
          <div key={`${url}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-md)] border border-primary/20 shadow-sm">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        {uploading ? (
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary" />
            Uploading…
          </div>
        ) : (
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-primary/35 bg-primary/5 transition-colors hover:border-primary hover:bg-primary/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="text-lg font-bold text-primary">+</span>
            <span className="sr-only">Upload photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
