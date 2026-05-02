import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LightbulbIcon, TrendingUp } from "lucide-react";

const favesByCategory = [
  { label: "Sparkly / metallic", value: 136 },
  { label: "Festival / boho outerwear", value: 66 },
  { label: "Jewellery bundles", value: 17 },
  { label: "Premium womenswear", value: 16 },
  { label: "H&M BNWT basics", value: 14 },
  { label: "Home / accessories", value: 7 },
  { label: "Kids (Mini Rodini / RC)", value: 6 },
];

const recommendations = [
  {
    category: "Sparkly / sequin mini dresses",
    why: "Your sparkling dress has 114 faves — the single most-wanted item in your whole shop. Clear unmet demand at every size.",
    whereToBuy: "Charity shops, car boots, Depop, eBay clearance",
    buyTarget: "£3–£15",
    sellTarget: "£25–£55",
    margin: "3–10×",
    timing: "Year-round",
    priority: "Highest",
  },
  {
    category: "Festival / fringe / tassel jackets",
    why: "Rita Ora jacket got 57 faves and there are 123 competing listings — demand is real and it's peak festival season right now.",
    whereToBuy: "Charity shops, car boots, Depop, end-of-season sales",
    buyTarget: "£5–£20",
    sellTarget: "£25–£60",
    margin: "3–8×",
    timing: "May–August (buy NOW)",
    priority: "Highest — seasonal window open",
  },
  {
    category: "Silver / metallic trousers & co-ords",
    why: "Zara sequin trousers got 15 faves. Metallic and disco-aesthetic pieces are consistently popular across your shop.",
    whereToBuy: "Charity shops, Zara sale, ASOS clearance",
    buyTarget: "£3–£12",
    sellTarget: "£15–£30",
    margin: "3–5×",
    timing: "Year-round",
    priority: "High",
  },
  {
    category: "Never Fully Dressed / Rotate / premium occasion tops",
    why: "Both your NFD camis attracted 5–6 faves and are the only listings of their kind — minimal competition, real buyers.",
    whereToBuy: "NFD outlets, charity shops in wealthier areas, TK Maxx",
    buyTarget: "£8–£20",
    sellTarget: "£25–£45",
    margin: "2–4×",
    timing: "Year-round",
    priority: "High",
  },
  {
    category: "Designer/French brand skirts & dresses (Isabel Marant, Sandro, Maje)",
    why: "Your IM Navajo skirt is listed at £35 when the market is £100–160. Buyers search these constantly. Charity shops in nice areas often have them unrecognised.",
    whereToBuy: "Charity shops (Notting Hill, Richmond, Wimbledon), eBay, Vestiaire",
    buyTarget: "£5–£30",
    sellTarget: "£60–£150",
    margin: "5–15×",
    timing: "Year-round",
    priority: "High — best margin potential",
  },
  {
    category: "Themed jewellery bundles (metallic, monochrome, colourblock)",
    why: "Monochrome bundle has 12 faves at £5. Zero sourcing cost if you assemble from loose charity-shop jewellery. Easy wins.",
    whereToBuy: "Charity shops (loose jewellery trays), car boots",
    buyTarget: "£0.50–£3",
    sellTarget: "£5–£10",
    margin: "3–10×",
    timing: "Year-round",
    priority: "Medium — low effort, low cost",
  },
  {
    category: "Mini Rodini NWT / BNWT kids (0–5 yr)",
    why: "Your Mini Rodini pieces are getting faves. The brand has a dedicated following. NWT items are found unrecognised at NCT sales.",
    whereToBuy: "NCT sales, Facebook Marketplace, Depop",
    buyTarget: "£2–£10",
    sellTarget: "£12–£25",
    margin: "3–5×",
    timing: "Year-round",
    priority: "Medium",
  },
];

const priorityColor = {
  "Highest": "bg-red-500 text-white",
  "Highest — seasonal window open": "bg-red-500 text-white",
  "High": "bg-amber-500 text-white",
  "High — best margin potential": "bg-amber-500 text-white",
  "Medium — low effort, low cost": "bg-emerald-500 text-white",
  "Medium": "bg-emerald-500 text-white",
};

export function BuyingGuide() {
  const maxFaves = Math.max(...favesByCategory.map((d) => d.value));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">What to Buy Next</h2>
        <p className="text-muted-foreground">Based on favourites across your 24 active listings</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
        <LightbulbIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-primary mb-1">The pattern in your shop</h4>
          <p className="text-sm text-primary/80">Your buyers consistently go for three things: sparkly / metallic party wear, festival-aesthetic outerwear, and premium brand pieces at secondhand prices. That's your niche — lean into it.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Where the demand is
        </h3>
        <p className="text-sm text-muted-foreground">Total favourites by category across all your listings</p>
        
        <div className="space-y-3 mt-4">
          {favesByCategory.map((d) => (
            <div key={d.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{d.label}</span>
                <span className="font-mono text-muted-foreground">{d.value}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${(d.value / maxFaves) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold">Buying Recommendations</h3>
        <p className="text-sm text-muted-foreground">Ranked by demand signal and margin opportunity.</p>

        <div className="grid gap-4 mt-4">
          {recommendations.map((r) => (
            <Card key={r.category}>
              <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
                <CardTitle className="text-base font-semibold leading-tight">{r.category}</CardTitle>
                <Badge variant="secondary" className={priorityColor[r.priority as keyof typeof priorityColor]}>
                  {r.priority}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{r.why}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Buy target</div>
                    <div className="font-mono text-sm font-medium">{r.buyTarget}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sell target</div>
                    <div className="font-mono text-sm font-medium">{r.sellTarget}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Margin</div>
                    <div className="font-mono text-sm font-medium text-emerald-500">{r.margin}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground min-w-16">Source:</span>
                    <span className="text-xs">{r.whereToBuy}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground min-w-16">Timing:</span>
                    <span className="text-xs">{r.timing}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-8">
        <h3 className="text-lg font-semibold">Quick reference</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Buy</TableHead>
                <TableHead>Sell</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((r) => (
                <TableRow key={r.category}>
                  <TableCell className="font-medium">{r.category}</TableCell>
                  <TableCell>{r.buyTarget}</TableCell>
                  <TableCell>{r.sellTarget}</TableCell>
                  <TableCell className="text-emerald-500">{r.margin}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{r.priority.split(" —")[0]}</span>
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