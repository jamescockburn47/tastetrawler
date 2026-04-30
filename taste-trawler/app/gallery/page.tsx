import { db } from '@/lib/db';
import { chatImages } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { PageContainer, PageHeader } from '@/components/page-container';
import { GalleryGrid } from '@/components/gallery-grid';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const images = await db
    .select()
    .from(chatImages)
    .orderBy(desc(chatImages.observedAt))
    .limit(100);

  return (
    <PageContainer>
      <PageHeader
        title="Evidence Wall"
        description="WhatsApp photos, AI notes, and the visual trail of every potential little money goblin."
      />
      <GalleryGrid images={images} />
    </PageContainer>
  );
}
