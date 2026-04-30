'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ListingEditorProps {
  title: string;
  description: string;
  brand: string | null;
  category: string;
  condition: string;
  suggestedPrice: number | null;
  onSave: (data: {
    title: string;
    description: string;
    listPrice: number;
    buyPrice: number | null;
    status: string;
  }) => Promise<void> | void;
  onCopyToClipboard: () => void;
  saving: boolean;
}

function priceToPence(price: string): number {
  return Math.round(parseFloat(price) * 100);
}

export function ListingEditor({
  title: initialTitle,
  description: initialDescription,
  brand,
  category,
  condition,
  suggestedPrice,
  onSave,
  onCopyToClipboard,
  saving,
}: ListingEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [listPrice, setListPrice] = useState(suggestedPrice ? (suggestedPrice / 100).toFixed(2) : '');
  const [buyPrice, setBuyPrice] = useState('');

  async function handleSave() {
    try {
      await onSave({
        title,
        description,
        listPrice: priceToPence(listPrice),
        buyPrice: buyPrice ? priceToPence(buyPrice) : null,
        status: 'draft',
      });
      toast.success('Saved. The inventory goblin has been fed.');
    } catch {
      toast.error('Could not save it. Deeply annoying. Please try again.');
    }
  }

  return (
    <div className="kitsch-card-quiet space-y-4 rounded-[var(--radius-xl)] p-5">
      <div>
        <p className="section-kicker">Listing atelier</p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
          Polish the goods
        </h2>
      </div>
      <div className="flex gap-2">
        {brand && <Badge variant="outline" className="text-[10px]">{brand}</Badge>}
        <Badge variant="outline" className="text-[10px]">{category}</Badge>
        <Badge variant="outline" className="text-[10px]">{condition}</Badge>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buyPrice" className="text-xs">Buy Price</Label>
          <Input id="buyPrice" type="number" step="0.01" placeholder="0.00" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listPrice" className="text-xs">List Price</Label>
          <Input id="listPrice" type="number" step="0.01" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Add to inventory'}
        </Button>
        <Button variant="outline" onClick={onCopyToClipboard}>Copy for Vinted</Button>
      </div>
    </div>
  );
}
