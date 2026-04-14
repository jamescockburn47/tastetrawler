import type { CompResult } from '@/lib/ebay/types';

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

const confidenceConfig = {
  high: { dot: 'bg-emerald-400', label: 'High confidence' },
  medium: { dot: 'bg-amber-400', label: 'Medium confidence' },
  low: { dot: 'bg-red-400', label: 'Low confidence' },
} as const;

const platformBadge = {
  vinted: { label: 'V', bg: 'bg-teal-500/20 text-teal-400' },
  ebay: { label: 'eB', bg: 'bg-blue-500/20 text-blue-400' },
} as const;

interface PricingPanelProps {
  comps: CompResult[];
  suggestedPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  priceConfidence: 'high' | 'medium' | 'low' | null;
  priceReasoning: string | null;
  buyPrice: number | null;
}

export function PricingPanel({
  comps, suggestedPrice, priceLow, priceHigh,
  priceConfidence, priceReasoning, buyPrice,
}: PricingPanelProps) {
  const margin = suggestedPrice && buyPrice ? suggestedPrice - buyPrice : null;
  const conf = priceConfidence ? confidenceConfig[priceConfidence] : null;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Pricing Intelligence</p>

      {/* Price range */}
      <div className="flex gap-6">
        {priceLow != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">QUICK SALE</p>
            <p className="font-mono text-sm text-muted-foreground">{formatPence(priceLow)}</p>
          </div>
        )}
        {suggestedPrice != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">RECOMMENDED</p>
            <p className="font-mono text-lg font-semibold text-emerald-400">{formatPence(suggestedPrice)}</p>
          </div>
        )}
        {priceHigh != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">PATIENT</p>
            <p className="font-mono text-sm text-muted-foreground">{formatPence(priceHigh)}</p>
          </div>
        )}
      </div>

      {/* Buy price + margin */}
      {(buyPrice != null || margin != null) && (
        <div className="flex gap-6">
          {buyPrice != null && (
            <div>
              <p className="text-[10px] text-muted-foreground">BOUGHT FOR</p>
              <p className="font-mono text-sm">{formatPence(buyPrice)}</p>
            </div>
          )}
          {margin != null && (
            <div>
              <p className="text-[10px] text-muted-foreground">EST. MARGIN</p>
              <p className="font-mono text-lg font-semibold text-amber-400">{formatPence(margin)}</p>
            </div>
          )}
        </div>
      )}

      {/* Confidence + reasoning */}
      {(conf || priceReasoning) && (
        <div className="flex items-start gap-2">
          {conf && (
            <span className="flex items-center gap-1 shrink-0">
              <span className={`inline-block h-2 w-2 rounded-full ${conf.dot}`} />
              <span className="text-[10px] text-muted-foreground">{conf.label}</span>
            </span>
          )}
          {priceReasoning && <p className="text-xs text-muted-foreground">{priceReasoning}</p>}
        </div>
      )}

      {/* Comps list */}
      {comps.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">COMPARABLES ({comps.length})</p>
          <div className="space-y-1">
            {comps.slice(0, 8).map((comp, i) => (
              <div key={i} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[9px] font-bold px-1 rounded ${platformBadge[comp.platform].bg}`}>
                    {platformBadge[comp.platform].label}
                  </span>
                  {comp.isSold && (
                    <span className="text-[9px] font-semibold text-emerald-400">SOLD</span>
                  )}
                  <a href={comp.url} target="_blank" rel="noopener" className="truncate text-muted-foreground hover:text-foreground">
                    {comp.title}
                  </a>
                </div>
                <span className="font-mono shrink-0">{formatPence(comp.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
