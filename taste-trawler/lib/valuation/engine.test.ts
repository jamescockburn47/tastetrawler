import assert from 'node:assert/strict';
import test from 'node:test';
import { buildValuation } from './engine';
import type { CompResult } from '@/lib/ebay/types';

const analysis = {
  brand: 'Coach',
  category: 'Bags',
  condition: 'Good',
  era: '1990s',
  material: 'leather',
  size: null,
};

const comps: CompResult[] = [
  { platform: 'vinted', title: 'Vintage Coach leather bag 1990s', price: 4200, url: '#1', imageUrl: '', condition: 'Good', seller: 'a', isSold: true },
  { platform: 'vinted', title: 'Coach leather shoulder bag', price: 4500, url: '#2', imageUrl: '', condition: 'Good', seller: 'b', isSold: true },
  { platform: 'ebay', title: 'Coach vintage leather bag', price: 5000, url: '#3', imageUrl: '', condition: 'Good', seller: 'c', isSold: false },
  { platform: 'ebay', title: 'Coach bag bundle job lot', price: 25000, url: '#4', imageUrl: '', condition: 'Used', seller: 'd', isSold: false },
];

test('buildValuation weights credible sold comps and ignores weird outliers', () => {
  const valuation = buildValuation(analysis, comps, 800);

  assert.equal(valuation.confidence, 'medium');
  assert.ok(valuation.targetPrice);
  assert.ok(valuation.targetPrice >= 4000);
  assert.ok(valuation.targetPrice <= 5200);
  assert.ok(valuation.ignoredComps.some((comp) => comp.title.includes('bundle')));
  assert.equal(valuation.expectedMargin, valuation.targetPrice! - 800);
});

test('buildValuation returns low confidence with no comps', () => {
  const valuation = buildValuation(analysis, []);

  assert.equal(valuation.confidence, 'low');
  assert.equal(valuation.targetPrice, null);
  assert.ok(valuation.risks.some((risk) => risk.includes('No comps')));
});
