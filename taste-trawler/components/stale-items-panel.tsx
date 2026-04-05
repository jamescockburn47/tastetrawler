import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import type { Item } from '@/lib/db/schema';

function daysSince(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function StaleItemsPanel({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing stale — she's shifting it."
        description="Items that sit listed for 14+ days without a sale will show up here. Clean slate for now."
        illustration={<span aria-hidden>✨</span>}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <div>
              <p className="text-sm">{item.title || 'Untitled'}</p>
              <p className="text-[10px] text-muted-foreground">
                Listed {daysSince(item.listedAt!)}d · {item.views} views · {item.likes} likes
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {item.likes === 0 && item.views! < 20 ? 'Relist?' : 'Reprice?'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
