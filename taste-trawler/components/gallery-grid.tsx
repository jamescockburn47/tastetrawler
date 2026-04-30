'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import type { ChatImage } from '@/lib/db/schema';

function timeAgo(date: Date | string | null): string {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function GalleryGrid({ images }: { images: ChatImage[] }) {
  const [selected, setSelected] = useState<ChatImage | null>(null);

  function openImageFromKeyboard(event: KeyboardEvent<HTMLDivElement>, image: ChatImage) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(image);
    }
  }

  if (!images?.length) {
    return (
      <EmptyState
        title="No photos yet."
        description="Photos sent in the WhatsApp group will appear here automatically."
        illustration={<span aria-hidden>📷</span>}
      />
    );
  }

  const analysis = selected?.vlmAnalysis as Record<string, unknown> | null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((img) => (
          <Card
            key={img.id}
            role="button"
            tabIndex={0}
            className="group cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setSelected(img)}
            onKeyDown={(event) => openImageFromKeyboard(event, img)}
          >
            <div className="relative aspect-square">
              <img
                src={img.blobUrl}
                alt={img.caption || img.vlmDescription?.slice(0, 80) || 'Photo'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-medium text-muted-foreground">
                {img.caption || img.vlmDescription?.slice(0, 100) || 'No description'}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                {img.speakerName && `${img.speakerName} · `}{timeAgo(img.observedAt)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl overflow-hidden border-primary/25 bg-card p-0">
          {selected && (
            <div className="flex flex-col md:flex-row">
              <DialogTitle className="sr-only">
                {selected.caption || selected.vlmDescription?.slice(0, 80) || 'Photo details'}
              </DialogTitle>
              <div className="flex items-center justify-center bg-black md:w-1/2">
                <img
                  src={selected.blobUrl}
                  alt=""
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4 md:w-1/2">
                {selected.speakerName && (
                  <p className="text-xs text-muted-foreground">
                    {selected.speakerName} · {timeAgo(selected.observedAt)}
                  </p>
                )}

                {selected.caption && (
                  <p className="text-sm font-medium">{selected.caption}</p>
                )}

                {analysis && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analysis</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.brand ? <Badge variant="outline" className="text-[10px]">{String(analysis.brand)}</Badge> : null}
                      {analysis.category ? <Badge variant="secondary" className="text-[10px]">{String(analysis.category)}</Badge> : null}
                      {analysis.condition ? <Badge variant="secondary" className="text-[10px]">{String(analysis.condition)}</Badge> : null}
                      {analysis.era ? <Badge variant="secondary" className="text-[10px]">{String(analysis.era)}</Badge> : null}
                      {analysis.material ? <Badge variant="secondary" className="text-[10px]">{String(analysis.material)}</Badge> : null}
                      {analysis.size ? <Badge variant="outline" className="text-[10px]">{String(analysis.size)}</Badge> : null}
                    </div>
                    {Array.isArray(analysis.colours) && analysis.colours.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(analysis.colours as string[]).map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    )}
                    {Array.isArray(analysis.styleTags) && analysis.styleTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(analysis.styleTags as string[]).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {typeof analysis.storyPotentialScore === 'number' && (
                      <p className="text-xs text-muted-foreground">
                        Story potential: {analysis.storyPotentialScore}/10
                      </p>
                    )}
                  </div>
                )}

                {selected.vlmDescription && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">VLM Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.vlmDescription}</p>
                  </div>
                )}

                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}

                {selected.discussion && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Discussion</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.discussion}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
