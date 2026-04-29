import type { JSX } from 'react';
import type { CompResult } from '@/lib/ebay/types';
import type { ValuationResult } from '@/lib/valuation/engine';

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
  valuation?: ValuationResult | null;
}

function compScore(comp: CompResult): number | null {
  const score = (comp as Partial<{ score: number }>).score;
  return typeof score === 'number' ? score : null;
}

export function PricingPanel({
  comps,
  suggestedPrice,
  priceLow,
  priceHigh,
  priceConfidence,
  priceReasoning,
  buyPrice,
  valuation,
}: PricingPanelProps): JSX.Element {
  const target = valuation?.targetPrice ?? suggestedPrice;
  const quick = valuation?.quickSalePrice ?? priceLow;
  const patient = valuation?.patientPrice ?? priceHigh;
  const margin = target && buyPrice ? target - buyPrice : null;
  const confidence = valuation?.confidence ?? priceConfidence;
  const conf = confidence ? confidenceConfig[confidence] : null;
  const topComps = valuation?.topComps ?? comps;
  const reasoning = valuation?.reasoning ?? priceReasoning;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Pricing Intelligence</p>

      <div className="flex gap-6">
        {quick != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">QUICK SALE</p>
            <p className="font-mono text-sm text-muted-foreground">{formatPence(quick)}</p>
          </div>
        )}
        {target != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">RECOMMENDED</p>
            <p className="font-mono text-lg font-semibold text-emerald-400">{formatPence(target)}</p>
          </div>
        )}
        {patient != null && (
          <div>
            <p className="text-[10px] text-muted-foreground">PATIENT</p>
            <p className="font-mono text-sm text-muted-foreground">{formatPence(patient)}</p>
          </div>
        )}
      </div>

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

      {(conf || reasoning) && (
        <div className="flex items-start gap-2">
          {conf && (
            <span className="flex items-center gap-1 shrink-0">
              <span className={`inline-block h-2 w-2 rounded-full ${conf.dot}`} />
              <span className="text-[10px] text-muted-foreground">{conf.label}</span>
            </span>
          )}
          {reasoning && <p className="text-xs text-muted-foreground">{reasoning}</p>}
        </div>
      )}

      {valuation?.risks?.length ? (
        <div className="rounded-md border border-border/60 bg-background/50 p-2">
          <p className="text-[10px] text-muted-foreground mb-1">WATCH OUT</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {valuation.risks.map((risk) => <li key={risk}>{risk}</li>)}
          </ul>
        </div>
      ) : null}

      {topComps.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">BEST COMPS ({topComps.length})</p>
          <div className="space-y-1">
            {topComps.slice(0, 8).map((comp, i) => {
              const score = compScore(comp);

              return (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[9px] font-bold px-1 rounded ${platformBadge[comp.platform].bg}`}>
                      {platformBadge[comp.platform].label}
                    </span>
                    {comp.isSold && (
                      <span className="text-[9px] font-semibold text-emerald-400">SOLD</span>
                    )}
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener"
                      className="truncate text-muted-foreground hover:text-foreground"
                    >
                      {comp.title}
                    </a>
                    {score != null && <span className="text-[9px] text-muted-foreground">{score}/100</span>}
                  </div>
                  <span className="font-mono shrink-0">{formatPence(comp.price)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
