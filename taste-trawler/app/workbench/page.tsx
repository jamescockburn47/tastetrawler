'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/photo-upload';
import { ListingEditor } from '@/components/listing-editor';
import { PricingPanel } from '@/components/pricing-panel';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/page-container';

type Stage = 'upload' | 'analysing' | 'editing';

export default function WorkbenchPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [comps, setComps] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleAnalyse() {
    if (photos.length === 0) return;
    setStage('analysing');

    const analysisRes = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoUrls: photos }) });
    const analysisData = await analysisRes.json();
    setAnalysis(analysisData);

    const searchQuery = [analysisData.brand, analysisData.category, analysisData.era].filter(Boolean).join(' ');
    const compsRes = await fetch('/api/comps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery }) });
    const compsData = await compsRes.json();
    setComps(compsData.results);

    const listingRes = await fetch('/api/generate-listing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis: analysisData, comps: compsData.results }) });
    const listingData = await listingRes.json();
    setListing(listingData);

    setStage('editing');
  }

  async function handleSave(data: { title: string; description: string; listPrice: number; buyPrice: number | null; status: string }) {
    setSaving(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, photos, brand: analysis?.brand, category: analysis?.category, condition: analysis?.condition, era: analysis?.era, colours: analysis?.colours, styleTags: analysis?.styleTags, material: analysis?.material, size: analysis?.size, storyPotentialScore: analysis?.storyPotentialScore }),
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
        title="Workbench"
        description="Draft, price, and photo-edit an item before it goes live."
      />
      <div className="space-y-6">
        {stage === 'upload' && (
          <div className="space-y-4">
            <PhotoUpload onUpload={setPhotos} />
            {photos.length > 0 && <Button onClick={handleAnalyse}>Analyse & Generate Listing</Button>}
          </div>
        )}
        {stage === 'analysing' && <p className="text-sm text-muted-foreground">Analysing photos and generating listing...</p>}
        {stage === 'editing' && listing && analysis && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <PhotoUpload onUpload={setPhotos} existingPhotos={photos} />
              <PricingPanel comps={comps} suggestedPrice={listing.suggestedPrice} priceReasoning={listing.priceReasoning} buyPrice={null} />
            </div>
            <ListingEditor title={listing.title} description={listing.description} brand={analysis.brand} category={listing.category} condition={analysis.condition} suggestedPrice={listing.suggestedPrice} onSave={handleSave} onCopyToClipboard={handleCopyToClipboard} saving={saving} />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
