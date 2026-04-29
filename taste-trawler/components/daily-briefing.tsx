import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BriefingStats {
  itemsSold30: number;
  profit30: number;
  profitKnown30: number;
  activeListings: number;
  staleListings: number;
}

function money(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DailyBriefing({ stats }: { stats: BriefingStats }) {
  const salesLine = stats.itemsSold30 > 0
    ? `${stats.itemsSold30} sold in 30 days. ${stats.profitKnown30 ? `${money(stats.profit30)} profit logged.` : 'Profit is hiding because buy prices are missing.'}`
    : 'No confirmed sales in the 30-day window. Calm, or suspiciously calm.';

  const staleLine = stats.staleListings > 0
    ? `${stats.staleListings} listing${stats.staleListings === 1 ? ' is' : 's are'} loitering past 14 days. Reprice, relist, or give them a stern talking-to.`
    : 'Nothing stale. The rails are behaving for once.';

  const stockLine = stats.activeListings > 0
    ? `${stats.activeListings} active listing${stats.activeListings === 1 ? '' : 's'} doing their little pageant online.`
    : 'No active listings. The shop floor is giving tumbleweed.';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Briefing</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
        <p>{salesLine}</p>
        <p>{stockLine}</p>
        <p>{staleLine}</p>
      </CardContent>
    </Card>
  );
}
