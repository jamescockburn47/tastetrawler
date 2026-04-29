'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/photo-upload';
import { ListingEditor } from '@/components/listing-editor';
import { PricingPanel } from '@/components/pricing-panel';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/page-container';
import type { PhotoAnalysis } from '@/lib/ai/analyse-photos';
import type { GeneratedListing } from '@/lib/ai/generate-listing';
import type { CompResult } from '@/lib/ebay/types';

type Stage = 'upload' | 'analysing' | 'editing';

type SaveListingData = {
  title: string;
  description: string;
  listPrice: number;
  buyPrice: number | null;
  status: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}

export default function WorkbenchPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [comps, setComps] = useState<CompResult[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleAnalyse() {
    if (photos.length === 0) return;
    setStage('analysing');

    const analysisData = await postJson<PhotoAnalysis>('/api/analyse', { photoUrls: photos });
    setAnalysis(analysisData);

    const searchQuery = [
      analysisData.brand,
      analysisData.material,
      analysisData.category,
      analysisData.size,
      analysisData.era,
      analysisData.condition,
    ].filter(Boolean).join(' ');
    const compsData = await postJson<{ results: CompResult[] }>('/api/comps', {
      query: searchQuery,
      sources: ['ebay', 'vinted'],
    });
    setComps(compsData.results);

    const listingData = await postJson<GeneratedListing>('/api/generate-listing', {
      analysis: analysisData,
      comps: compsData.results,
    });
    setListing(listingData);

    setStage('editing');
  }

  async function handleSave(data: SaveListingData) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        photos,
        brand: analysis?.brand,
        category: analysis?.category,
        condition: analysis?.condition,
        era: analysis?.era,
        colours: analysis?.colours,
        styleTags: analysis?.styleTags,
        material: analysis?.material,
        size: analysis?.size,
        storyPotentialScore: analysis?.storyPotentialScore,
      };
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`);
      }
      setStage('upload');
      setPhotos([]);
      setAnalysis(null);
      setListing(null);
      setComps([]);
    } finally {
      setSaving(false);
    }
  }

  function handleCopyToClipboard() {
    if (!listing) return;
    navigator.clipboard.writeText(`${listing.title}\n\n${listing.description}`);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Listing Studio"
        description="Photos in, Vinted listing out. Ideally with fewer crimes against pricing."
      />
      <div className="space-y-6">
        {stage === 'upload' && (
          <div className="space-y-4">
            <PhotoUpload onUpload={setPhotos} />
            {photos.length > 0 && <Button onClick={handleAnalyse}>Analyse the evidence</Button>}
          </div>
        )}
        {stage === 'analysing' && (
          <p className="text-sm text-muted-foreground">
            Analysing photos, judging comps, preparing a tiny pricing sermon...
          </p>
        )}
        {stage === 'editing' && listing && analysis && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <PhotoUpload onUpload={setPhotos} existingPhotos={photos} />
              <PricingPanel
                comps={comps}
                suggestedPrice={listing.suggestedPrice}
                priceLow={listing.priceLow ?? null}
                priceHigh={listing.priceHigh ?? null}
                priceConfidence={listing.priceConfidence ?? null}
                priceReasoning={listing.priceReasoning}
                buyPrice={null}
                valuation={listing.valuation ?? null}
              />
            </div>
            <ListingEditor
              title={listing.title}
              description={listing.description}
              brand={analysis.brand}
              category={listing.category}
              condition={analysis.condition}
              suggestedPrice={listing.suggestedPrice}
              onSave={handleSave}
              onCopyToClipboard={handleCopyToClipboard}
              saving={saving}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
