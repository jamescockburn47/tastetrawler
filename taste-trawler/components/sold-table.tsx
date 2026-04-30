'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import type { Item } from '@/lib/db/schema';

function formatPence(pence: number | null): string {
  if (pence === null) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function profit(soldPrice: number | null, buyPrice: number | null): { label: string; positive: boolean } | null {
  if (!soldPrice) return null;
  if (!buyPrice) return null;
  const p = soldPrice - buyPrice;
  return { label: `${p >= 0 ? '+' : ''}${formatPence(p)}`, positive: p >= 0 };
}

function EditablePrice({
  value,
  itemId,
  field,
  onSaved,
}: {
  value: number | null;
  itemId: string;
  field: 'buyPrice' | 'soldPrice';
  onSaved: (newPence: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setInput(value ? (value / 100).toFixed(2) : '');
    setEditing(true);
  }

  async function save() {
    const pounds = parseFloat(input);
    if (isNaN(pounds) || pounds < 0) {
      setEditing(false);
      return;
    }

    const pence = Math.round(pounds * 100);
    setSaving(true);
    try {
      await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: pence }),
      });
      onSaved(pence);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <span className="text-muted-foreground text-sm">£</span>
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-24 rounded-full border border-input bg-card/70 px-3 py-1 text-right font-mono text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title="Click to edit"
      aria-label={`Edit ${field === 'buyPrice' ? 'buy' : 'sold'} price`}
      className="w-full cursor-pointer text-right font-mono text-sm font-semibold [font-feature-settings:'tnum'] decoration-dashed underline-offset-2 hover:text-primary hover:underline"
    >
      {formatPence(value)}
    </button>
  );
}

export function SoldTable({ items: initialItems }: { items: Item[] }) {
  const [items, setItems] = useState(initialItems);

  function updateField(id: string, field: 'buyPrice' | 'soldPrice', value: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  if (!items?.length) {
    return (
      <EmptyState
        title="Nothing sold yet."
        description="Items will appear here once marked as sold."
        illustration={<span aria-hidden>🏷️</span>}
      />
    );
  }

  return (
    <div>
      <p className="section-kicker mb-2">Click Buy or Sold price to edit it.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <span className="sr-only">Photo</span>
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right font-mono">Buy</TableHead>
            <TableHead className="text-right font-mono">Sold</TableHead>
            <TableHead className="text-right font-mono">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const p = profit(item.soldPrice, item.buyPrice);
            return (
              <TableRow
                key={item.id}
                className="group transition-colors hover:bg-primary/5"
              >
                <TableCell>
                  {item.photos.length > 0 ? (
                    <img src={item.photos[0]} alt="" className="h-10 w-10 rounded-[var(--radius-sm)] object-cover opacity-80 shadow-sm" />
                  ) : (
                    <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-muted" />
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{item.title || 'Untitled'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.brand && <Badge variant="outline" className="text-[10px]">{item.brand}</Badge>}
                    {item.category && <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>}
                    {item.condition && <Badge variant="secondary" className="text-[10px]">{item.condition}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <EditablePrice value={item.buyPrice} itemId={item.id} field="buyPrice" onSaved={(v) => updateField(item.id, 'buyPrice', v)} />
                </TableCell>
                <TableCell>
                  <EditablePrice value={item.soldPrice} itemId={item.id} field="soldPrice" onSaved={(v) => updateField(item.id, 'soldPrice', v)} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">
                  {p ? (
                    <span className={p.positive ? 'font-bold text-primary' : 'text-destructive'}>{p.label}</span>
                  ) : (
                    <span className="text-muted-foreground/40 text-[10px]">add buy price</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
