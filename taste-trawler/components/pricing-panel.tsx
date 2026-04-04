import type { CompResult } from '@/lib/ebay/types';

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

interface PricingPanelProps {
  comps: CompResult[];
  suggestedPrice: number | null;
  priceReasoning: string | null;
  buyPrice: number | null;
}

export function PricingPanel({ comps, suggestedPrice, priceReasoning, buyPrice }: PricingPanelProps) {
  const margin = suggestedPrice && buyPrice ? suggestedPrice - buyPrice : null;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Pricing Intelligence</p>
      <div className="flex gap-6">
        {buyPrice !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">BOUGHT FOR</p>
            <p className="font-mono text-sm">{formatPence(buyPrice)}</p>
          </div>
        )}
        {suggestedPrice !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">SUGGESTED</p>
            <p className="font-mono text-lg font-semibold text-emerald-400">{formatPence(suggestedPrice)}</p>
          </div>
        )}
        {margin !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground">EST. MARGIN</p>
            <p className="font-mono text-lg font-semibold text-amber-400">{formatPence(margin)}</p>
          </div>
        )}
      </div>
      {priceReasoning && <p className="text-xs text-muted-foreground">{priceReasoning}</p>}
      {comps.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">COMPARABLES</p>
          <div className="space-y-1">
            {comps.slice(0, 5).map((comp, i) => (
              <div key={i} className="flex justify-between text-xs">
                <a href={comp.url} target="_blank" rel="noopener" className="truncate max-w-[70%] text-muted-foreground hover:text-foreground">{comp.title}</a>
                <span className="font-mono">{formatPence(comp.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
