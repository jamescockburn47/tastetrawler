'use client';

import { useState } from 'react';
import type { JSX } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SaleRow = {
  id: string;
  itemId: string | null;
  title: string;
  photo: string | null;
  salePrice: number | null;
  buyPriceAtSale: number | null;
  netProceeds: number | null;
  platform: string;
  soldAt: string | null;
  status: 'draft' | 'needs_review' | 'confirmed' | 'void';
  confidence: number;
  notes: string | null;
};

type SalesReviewProps = {
  rows: SaleRow[];
};

function formatPence(pence: number | null): string {
  if (pence == null) return '—';
  return `£${(pence / 100).toFixed(2)}`;
}

function profit(sale: SaleRow): number | null {
  if (sale.netProceeds == null || sale.buyPriceAtSale == null) return null;
  return sale.netProceeds - sale.buyPriceAtSale;
}

function statusTone(status: SaleRow['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'confirmed') return 'default';
  if (status === 'needs_review') return 'destructive';
  if (status === 'void') return 'outline';
  return 'secondary';
}

export function SalesReview({ rows: initialRows }: SalesReviewProps): JSX.Element {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function confirm(id: string): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/sales/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'web' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not confirm sale');
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: body.sale.status } : row)),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function savePrice(
    id: string,
    field: 'salePrice' | 'buyPriceAtSale',
    pounds: string,
  ): Promise<void> {
    const value = Math.round(parseFloat(pounds) * 100);
    if (!Number.isFinite(value) || value < 0) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, actor: 'web' }),
      });
      const sale = await res.json();
      if (!res.ok) throw new Error(sale.error ?? 'Could not update sale');
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, [field]: value, netProceeds: sale.netProceeds } : row,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="No sales to review."
        description="Suspiciously peaceful. Once MG logs sales from WhatsApp, they will queue up here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Sale</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right font-mono">Sold</TableHead>
          <TableHead className="text-right font-mono">Buy</TableHead>
          <TableHead className="text-right font-mono">Profit</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const p = profit(row);
          const soldDate = row.soldAt ? new Date(row.soldAt).toLocaleDateString('en-GB') : 'date needed';
          return (
            <TableRow key={row.id}>
              <TableCell>
                {row.photo ? (
                  <img src={row.photo} alt="" className="h-9 w-9 rounded object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="max-w-[280px] truncate text-sm font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.platform} · {soldDate}
                  </p>
                  {row.notes && (
                    <p className="max-w-[360px] truncate text-xs text-muted-foreground">{row.notes}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusTone(row.status)} className="text-[10px]">
                  {row.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <input
                  aria-label="Sale price"
                  defaultValue={row.salePrice != null ? (row.salePrice / 100).toFixed(2) : ''}
                  onBlur={(e) => savePrice(row.id, 'salePrice', e.target.value)}
                  className="w-20 rounded border border-border bg-background px-2 py-1 text-right font-mono text-sm"
                />
              </TableCell>
              <TableCell className="text-right">
                <input
                  aria-label="Buy price"
                  defaultValue={row.buyPriceAtSale != null ? (row.buyPriceAtSale / 100).toFixed(2) : ''}
                  onBlur={(e) => savePrice(row.id, 'buyPriceAtSale', e.target.value)}
                  className="w-20 rounded border border-border bg-background px-2 py-1 text-right font-mono text-sm"
                />
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {p == null ? (
                  <span className="text-muted-foreground">needs cost</span>
                ) : (
                  <span className={p >= 0 ? 'text-emerald-500' : 'text-destructive'}>
                    {formatPence(p)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {row.status !== 'confirmed' && row.status !== 'void' ? (
                  <Button size="sm" onClick={() => confirm(row.id)} disabled={busyId === row.id}>
                    {busyId === row.id ? 'Logging...' : 'Confirm'}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">fed the ledger</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
