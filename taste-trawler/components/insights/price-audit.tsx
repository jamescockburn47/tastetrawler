import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

type Verdict = "underpriced" | "overpriced" | "fair";

interface Listing {
  name: string;
  brand: string;
  size: string;
  condition: string;
  yourPrice: number;
  marketRange: string;
  faves: number;
  verdict: Verdict;
  note: string;
}

const listings: Listing[] = [
  {
    name: "Isabel Marant Navajo mini skirt",
    brand: "Isabel Marant",
    size: "S / UK 8-10",
    condition: "Very good",
    yourPrice: 35,
    marketRange: "£100–£160",
    faves: 5,
    verdict: "underpriced",
    note: "Isabel Marant skirts on Vinted consistently sell for £100–160. This is the biggest pricing miss — consider repricing to £65–90.",
  },
  {
    name: "Sparkling mini slip dress",
    brand: "—",
    size: "S / UK 8-10",
    condition: "Very good",
    yourPrice: 50,
    marketRange: "£4–£18",
    faves: 114,
    verdict: "overpriced",
    note: "114 faves with no sale is a classic sign of price resistance. Comparable unbranded sparkly dresses fetch £4–18. The interest is there — a drop to £25–30 would likely convert.",
  },
  {
    name: "Rita Ora x Primark stone tassel jacket BNWT",
    brand: "Primark",
    size: "M / UK 12-14",
    condition: "New with tags",
    yourPrice: 20,
    marketRange: "£20–£25",
    faves: 57,
    verdict: "fair",
    note: "123 competing listings, second-highest result also at £20 BNWT. Correctly priced given the supply. 57 faves shows good demand.",
  },
  {
    name: "Mini Rodini seahorse dress (NWT)",
    brand: "Mini Rodini",
    size: "9–12 months",
    condition: "New with tags",
    yourPrice: 20,
    marketRange: "£6–£15",
    faves: 1,
    verdict: "overpriced",
    note: "Most Mini Rodini 9–12m dresses sell for £3–12 even in Very good. NWT justifies a premium, but £14–16 would convert faster.",
  },
  {
    name: "Mini Rodini horse dress (NWT)",
    brand: "Mini Rodini",
    size: "9–12 months",
    condition: "New with tags",
    yourPrice: 20,
    marketRange: "£6–£15",
    faves: 2,
    verdict: "overpriced",
    note: "Same reasoning as the seahorse dress — NWT is great but the market ceiling for this size is around £12–16.",
  },
  {
    name: "Roberto Cavalli rainbow leopard dress NWT",
    brand: "Roberto Cavalli",
    size: "9 years / 134 cm",
    condition: "New with tags",
    yourPrice: 20,
    marketRange: "£30–£60",
    faves: 0,
    verdict: "underpriced",
    note: "Designer kids brand. NWT Roberto Cavalli kids items typically sell £30–60. Try £30–35 as a starting point.",
  },
  {
    name: "Never Fully Dressed cut-out cami (M)",
    brand: "Never Fully Dressed",
    size: "M / UK 12-14",
    condition: "New with tags",
    yourPrice: 25,
    marketRange: "£25–£30",
    faves: 6,
    verdict: "fair",
    note: "Only direct comps are your own two listings. A similar NFD top lists at £30. Your price is slightly conservative — could try £28.",
  },
  {
    name: "Never Fully Dressed cut-out cami (S)",
    brand: "Never Fully Dressed",
    size: "S / UK 8-10",
    condition: "New with tags",
    yourPrice: 25,
    marketRange: "£25–£30",
    faves: 5,
    verdict: "fair",
    note: "Same as above — well priced, marginal room to nudge up to £28.",
  },
  {
    name: "Mini Rodini yellow leopard hat NWT",
    brand: "Mini Rodini",
    size: "1–2 years",
    condition: "New with tags",
    yourPrice: 5,
    marketRange: "£8–£15",
    faves: 2,
    verdict: "underpriced",
    note: "Mini Rodini hats retail at £18–28. NWT secondhand should command £8–12. You're leaving money on the table at £5.",
  },
  {
    name: "Zara silver sequin trousers",
    brand: "Zara",
    size: "L / UK 16-18",
    condition: "Very good",
    yourPrice: 15,
    marketRange: "£10–£20",
    faves: 15,
    verdict: "fair",
    note: "Comps range from £4.50 (S, VG) to £17 (S, VG shorts). Your price for an L in Very good is well-positioned.",
  },
  {
    name: "Zara metallic maxi dress BNWT",
    brand: "Zara",
    size: "L / UK 16-18",
    condition: "New with tags",
    yourPrice: 15,
    marketRange: "£15–£25",
    faves: 1,
    verdict: "fair",
    note: "BNWT Zara dresses in larger sizes can reach £20–25. £15 will sell, but £18 is worth testing.",
  },
  {
    name: "Navy military jacket (leopard cuffs)",
    brand: "—",
    size: "L / UK 16-18",
    condition: "Very good",
    yourPrice: 10,
    marketRange: "£12–£25",
    faves: 9,
    verdict: "underpriced",
    note: "Distinctive vintage-style piece with leopard cuffs and silver buttons. 9 faves signals real interest. Try £15.",
  },
  {
    name: "Vera Wang silver napkin rings",
    brand: "Vera Wang",
    size: "—",
    condition: "Good",
    yourPrice: 20,
    marketRange: "£20–£40",
    faves: 5,
    verdict: "fair",
    note: "Vera Wang sets retail for £40–80+. Your price is fair for 'Good' condition. Could test £25 given the brand.",
  },
  {
    name: "H&M floral linen dress BNWT",
    brand: "H&M",
    size: "M / UK 12-14",
    condition: "New with tags",
    yourPrice: 10,
    marketRange: "£8–£15",
    faves: 2,
    verdict: "fair",
    note: "Standard H&M BNWT pricing. Correct.",
  },
  {
    name: "H&M sparkly silver top BNWT",
    brand: "H&M",
    size: "M / UK 12-14",
    condition: "New with tags",
    yourPrice: 10,
    marketRange: "£8–£15",
    faves: 7,
    verdict: "fair",
    note: "7 faves shows good interest. Correctly priced.",
  },
  {
    name: "H&M cream pearl cuff dress BNWT",
    brand: "H&M",
    size: "S / UK 8-10",
    condition: "New with tags",
    yourPrice: 10,
    marketRange: "£8–£15",
    faves: 5,
    verdict: "fair",
    note: "Standard H&M BNWT pricing. Correct.",
  },
  {
    name: "Zara Woman white summer dress BNWT",
    brand: "Zara Woman",
    size: "XS / UK 4-6",
    condition: "New with tags",
    yourPrice: 10,
    marketRange: "£10–£18",
    faves: 2,
    verdict: "fair",
    note: "Correctly priced. BNWT XS Zara dresses rarely exceed £15.",
  },
  {
    name: "Monochrome necklace bundle",
    brand: "Bundle",
    size: "—",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£5–£10",
    faves: 12,
    verdict: "fair",
    note: "12 faves is strong for a £5 bundle. Could nudge to £7 to test — but £5 is fine if you want a quick sale.",
  },
  {
    name: "Metallic necklace bundle",
    brand: "Bundle",
    size: "—",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£5–£10",
    faves: 5,
    verdict: "fair",
    note: "Standard bundle pricing.",
  },
  {
    name: "Mango handcrafted tassel necklace",
    brand: "Mango",
    size: "—",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£4–£10",
    faves: 2,
    verdict: "fair",
    note: "Reasonable for a Mango accessory.",
  },
  {
    name: "Vintage chartreuse necklace bundle",
    brand: "—",
    size: "—",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£5–£10",
    faves: 1,
    verdict: "fair",
    note: "Standard bundle pricing.",
  },
  {
    name: "Metallic bodycon dress + handbag bundle",
    brand: "Bundle",
    size: "S / UK 8-10",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£5–£12",
    faves: 0,
    verdict: "fair",
    note: "Low faves suggest the bundle combination may not be appealing. Consider splitting into individual listings.",
  },
  {
    name: "M&S girls biker jacket",
    brand: "Marks & Spencer",
    size: "5 years / 110 cm",
    condition: "Very good",
    yourPrice: 5,
    marketRange: "£4–£8",
    faves: 1,
    verdict: "fair",
    note: "Limited resale value for M&S kids. Correctly priced.",
  },
  {
    name: "Mini Rodini elephant tattoos",
    brand: "Mini Rodini",
    size: "One size",
    condition: "New without tags",
    yourPrice: 5,
    marketRange: "£3–£8",
    faves: 0,
    verdict: "fair",
    note: "Novelty accessory item. £5 is reasonable.",
  },
];

const verdictLabel: Record<Verdict, string> = {
  underpriced: "Underpriced",
  overpriced: "Overpriced",
  fair: "Fair",
};

const verdictIcon = {
  underpriced: <AlertCircle className="w-4 h-4 text-amber-500" />,
  overpriced: <XCircle className="w-4 h-4 text-red-500" />,
  fair: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
};

const badgeVariant = {
  underpriced: "secondary" as const,
  overpriced: "destructive" as const,
  fair: "default" as const, // In shadcn, default is usually primary/neutral. I'll use outline for fair.
};

export function PriceAudit() {
  const underpriced = listings.filter((l) => l.verdict === "underpriced");
  const overpriced = listings.filter((l) => l.verdict === "overpriced");
  const fair = listings.filter((l) => l.verdict === "fair");

  const totalYourPrice = listings.reduce((s, l) => s + l.yourPrice, 0);
  const potentialGain = underpriced.reduce((s, l) => {
    const mid = l.marketRange
      .replace(/[£,]/g, "")
      .split("–")
      .map(Number);
    return s + Math.round((mid[0] + mid[1]) / 2) - l.yourPrice;
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Price Audit</h2>
        <p className="text-muted-foreground">Checked against live Vinted market data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Underpriced</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underpriced.length}</div>
            <p className="text-xs text-muted-foreground mt-1">+£{potentialGain} potential gain</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overpriced</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overpriced.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Blocking sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fair Price</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fair.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Well positioned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Action Required: Underpriced
          </h3>
          <div className="space-y-4">
            {underpriced.map((l) => (
              <Card key={l.name} className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{l.name}</CardTitle>
                      <CardDescription>{l.brand} · {l.size} · {l.condition}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10">Underpriced</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Your price</div>
                      <div className="font-mono font-medium">£{l.yourPrice}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Market range</div>
                      <div className="font-mono font-medium text-amber-600 dark:text-amber-400">{l.marketRange}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{l.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Consider Reducing: Overpriced
          </h3>
          <div className="space-y-4">
            {overpriced.map((l) => (
              <Card key={l.name} className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{l.name}</CardTitle>
                      <CardDescription>{l.brand} · {l.size} · {l.condition}</CardDescription>
                    </div>
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Overpriced</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Your price</div>
                      <div className="font-mono font-medium">£{l.yourPrice}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Market range</div>
                      <div className="font-mono font-medium text-red-600 dark:text-red-400">{l.marketRange}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{l.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-8">
        <h3 className="text-lg font-semibold">All Listings Overview</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Faves</TableHead>
                <TableHead>Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => (
                <TableRow key={l.name}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>£{l.yourPrice}</TableCell>
                  <TableCell className="text-muted-foreground">{l.marketRange}</TableCell>
                  <TableCell className="text-right">{l.faves}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {verdictIcon[l.verdict]}
                      <span className="text-sm text-muted-foreground">{verdictLabel[l.verdict]}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}