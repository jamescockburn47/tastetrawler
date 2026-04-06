'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import type { Item } from '@/lib/db/schema';

function formatPence(pence: number | null): string {
  if (pence === null) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function daysSince(date: Date | string | null): string {
  if (!date) return '—';
  return `${Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))}d`;
}

const statusColour: Record<string, string> = {
  draft: 'secondary', listed: 'default', sold: 'default', stale: 'destructive', archived: 'outline',
};

export function ItemTable({ items }: { items: Item[] }) {
  if (!items?.length) {
    return (
      <EmptyState
        title="Empty rails."
        description="No items match this filter yet. Add one from the bot, or change the status tab."
        illustration={<span aria-hidden>📦</span>}
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
          <TableHead>Status</TableHead>
          <TableHead className="text-right font-mono">Buy</TableHead>
          <TableHead className="text-right font-mono">List</TableHead>
          <TableHead className="text-right font-mono">Sold</TableHead>
          <TableHead className="text-right font-mono">Age</TableHead>
          <TableHead className="text-right font-mono">Views</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="group border-b border-border transition-colors hover:bg-accent/40 focus-within:bg-accent/40"
          >
            <TableCell>
              {item.photos.length > 0 ? (
                <img src={item.photos[0]} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">{item.title || 'Untitled'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {item.brand && <Badge variant="outline" className="text-[10px]">{item.brand}</Badge>}
                {item.category && <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>}
                {item.condition && <Badge variant="secondary" className="text-[10px]">{item.condition}</Badge>}
                {item.era && <Badge variant="secondary" className="text-[10px]">{item.era}</Badge>}
                {item.colours?.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell><Badge variant={statusColour[item.status] as any} className="text-[10px]">{item.status}</Badge></TableCell>
            <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">{formatPence(item.buyPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">{formatPence(item.listPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm [font-feature-settings:'tnum']">{formatPence(item.soldPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground [font-feature-settings:'tnum']">{daysSince(item.listedAt)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground [font-feature-settings:'tnum']">{item.views}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
