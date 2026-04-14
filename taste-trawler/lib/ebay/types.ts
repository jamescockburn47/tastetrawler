export interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  image: { imageUrl: string };
  condition: string;
  itemWebUrl: string;
  seller: { username: string };
}

export interface EbaySearchResponse {
  itemSummaries?: EbayItem[];
  total: number;
  next?: string;
}

export interface CompResult {
  platform: 'ebay' | 'vinted';
  title: string;
  price: number;       // pence
  url: string;
  imageUrl: string;
  condition: string;
  seller: string;
  isSold: boolean;
}
