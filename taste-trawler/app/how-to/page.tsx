import { PageContainer, PageHeader } from '@/components/page-container';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="kitsch-card-quiet space-y-3 rounded-[var(--radius-xl)] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Command({ text, desc }: { text: string; desc: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <code className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-sm font-semibold text-foreground">{text}</code>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-muted-foreground">
      {children}
    </p>
  );
}

export default function HowToPage() {
  return (
    <PageContainer>
      <PageHeader
        title="The Manual"
        description="Everything the bot and website can do, because chaos is better with instructions."
      />
      <div className="max-w-3xl space-y-5">

        <Section title="Evaluating an item">
          <p className="text-sm text-muted-foreground">
            Send a photo to the WhatsApp chat. The bot automatically analyses it — brand, category, condition, estimated resale price, and eBay comparables. You do not need to type anything.
          </p>
          <p className="text-sm text-muted-foreground">
            To get a second opinion from Gemini (a different AI), type:
          </p>
          <Command text="tt second opinion" desc="Re-analyses the last photo with Gemini" />
        </Section>

        <Section title="Listing an item">
          <p className="text-sm text-muted-foreground">
            Send a photo and say &quot;list this&quot; (or &quot;save this&quot;, &quot;add this&quot;). The bot generates a title and description and saves it as a draft. You can then copy the description into Vinted.
          </p>
          <Command text="tt list this" desc="Save the last photo as a draft listing" />
          <Command text="tt list this, paid £4" desc="Same, but records the buy price too" />
          <Note>The bot never lists anything on Vinted for you. All actual listing is done in the Vinted app.</Note>
        </Section>

        <Section title="Recording what you paid">
          <p className="text-sm text-muted-foreground">
            Tell the bot what you paid for any item — it matches by title and saves it so profit can be calculated.
          </p>
          <Command text="tt paid £3 for the Nike leggings" desc="Records buy price on that item" />
          <Command text="tt add buy price Nike leggings £3" desc="Same thing, explicit version" />
          <p className="text-sm text-muted-foreground">
            You can also click any price in the <strong>Sold</strong> section of the Inventory page to edit it directly.
          </p>
        </Section>

        <Section title="Checking sales and profit">
          <Command text="tt stats" desc="Revenue, profit, items sold — last 30 days" />
          <Command text="tt stats 90" desc="Same, but last 90 days" />
          <Note>
            Profit is only calculated where a buy price has been recorded. Items imported before buy prices were tracked show revenue only.
          </Note>
        </Section>

        <Section title="Syncing with Vinted">
          <p className="text-sm text-muted-foreground">
            The bot checks your Vinted wardrobe every night and marks anything that&apos;s sold. You can also trigger a manual check:
          </p>
          <Command text="tt vinted sync" desc="Check what has sold and update views / likes" />
          <Command text="tt tidy" desc="Full refresh — fill missing details, AI-analyse photos, sync sales (takes a few minutes)" />
        </Section>

        <Section title="Finding stale listings">
          <Command text="tt stale" desc="Items listed 14+ days without selling" />
          <p className="text-sm text-muted-foreground">
            Stale items also appear on the Dashboard automatically.
          </p>
        </Section>

        <Section title="Looking up prices">
          <Command text="tt comps Levi's 501 jeans" desc="eBay sold prices for that search" />
          <Command text="tt search Zara trench coat price UK" desc="Web search for retail / resale prices" />
        </Section>

        <Section title="Recalling a past photo">
          <p className="text-sm text-muted-foreground">
            Every photo sent in the chat is stored and searchable by description.
          </p>
          <Command text="tt find that green dress from last week" desc="Searches photo archive by description" />
          <p className="text-sm text-muted-foreground">
            You can also browse all photos in the <strong>Gallery</strong> tab.
          </p>
        </Section>

        <Section title="Morning briefing">
          <p className="text-sm text-muted-foreground">
            Every morning at 7:30 the bot sends a summary to the group chat: yesterday&apos;s sales, current active listings, anything stale, and any errors. You do not need to do anything to trigger it.
          </p>
        </Section>

        <Section title="Editing items on the website">
          <p className="text-sm text-muted-foreground">
            Go to <strong>Inventory → Sold</strong>. Click any figure in the Buy or Sold price column to edit it inline — type the new amount in pounds and press Enter. The change saves immediately.
          </p>
        </Section>

        <Section title="If the bot stops responding">
          <p className="text-sm text-muted-foreground">
            The bot runs on a server and reconnects automatically if it drops. If it is completely unresponsive for more than a few minutes, message James — he can restart it remotely.
          </p>
        </Section>

      </div>
    </PageContainer>
  );
}
