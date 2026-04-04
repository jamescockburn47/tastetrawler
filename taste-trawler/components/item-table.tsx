'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
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
          <TableRow key={item.id}>
            <TableCell>
              {item.photos.length > 0 ? (
                <img src={item.photos[0]} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">{item.title || 'Untitled'}</TableCell>
            <TableCell><Badge variant={statusColour[item.status] as any} className="text-[10px]">{item.status}</Badge></TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.buyPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.listPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatPence(item.soldPrice)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">{daysSince(item.listedAt)}</TableCell>
            <TableCell className="text-right font-mono text-sm text-muted-foreground">{item.views}</TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No items yet. Head to the Workbench to add your first item.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
