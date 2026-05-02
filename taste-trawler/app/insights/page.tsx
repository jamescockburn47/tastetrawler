import { PageContainer, PageHeader } from '@/components/page-container';
import { PriceAudit } from '@/components/insights/price-audit';
import { BuyingGuide } from '@/components/insights/buying-guide';

export default function InsightsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Market Insights"
        description="Automated pricing audit and sourcing recommendations based on your Vinted performance."
      />
      <div className="space-y-12">
        <section>
          <BuyingGuide />
        </section>
        <section>
          <PriceAudit />
        </section>
      </div>
    </PageContainer>
  );
}