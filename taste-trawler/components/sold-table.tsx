'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import type { Item } from '@/lib/db/schema';

function formatPence(pence: number | null): string {
  if (pence === null) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function profit(soldPrice: number | null, buyPrice: number | null): { label: string; positive: boolean } | null {
  if (!soldPrice) return null;
  if (!buyPrice) return { label: `${formatPence(soldPrice)} sold (buy price unknown)`, positive: true };
  const p = soldPrice - buyPrice;
  return { label: `${p >= 0 ? '+' : ''}${formatPence(p)}`, positive: p >= 0 };
}

export function SoldTable({ items }: { items: Item[] }) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="text-right font-mono">Buy</TableHead>
          <TableHead className="text-right font-mono">Sold</TableHead>
          <TableHead className="text-right font-mono">Profit</TableHead>
          <TableHead className="text-right font-mono">Sold On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const p = profit(item.soldPrice, item.buyPrice);
          return (
            <TableRow
              key={item.id}
              className="group border-b border-border transition-colors hover:bg-accent/40"
            >
              <TableCell>
                {item.photos.length > 0 ? (
                  <img src={item.photos[0]} alt="" className="h-8 w-8 rounded object-cover opacity-70" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted" />
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
              <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum'] text-muted-foreground">{formatPence(item.buyPrice)}</TableCell>
              <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">{formatPence(item.soldPrice)}</TableCell>
              <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">
                {p ? (
                  <span className={p.positive ? 'text-emerald-500' : 'text-destructive'}>{p.label}</span>
                ) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-muted-foreground [font-feature-settings:'tnum']">{formatDate(item.soldAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
