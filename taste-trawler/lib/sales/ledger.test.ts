import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSaleValues, computeNetProceeds, saleNeedsMoreInfo } from './ledger-utils';

test('computeNetProceeds subtracts fees, postage, and discounts from sale price', () => {
  assert.equal(computeNetProceeds({ salePrice: 3000, fees: 150, postage: 300, discount: 50 }), 2500);
});

test('saleNeedsMoreInfo asks only for required missing fields', () => {
  assert.deepEqual(
    saleNeedsMoreInfo({ salePrice: 2800, soldAt: '2026-04-29', buyPriceAtSale: null }),
    ['which item sold', 'buy price'],
  );
});

test('buildSaleValues stores pence values and dates for a guided draft', () => {
  const values = buildSaleValues({
    itemId: 'item_1',
    salePrice: 2800,
    buyPriceAtSale: 400,
    soldAt: '2026-04-29T12:00:00.000Z',
    platform: 'vinted',
    fees: 0,
    postage: 0,
  });

  assert.equal(values.status, 'draft');
  assert.equal(values.netProceeds, 2800);
  assert.equal(values.buyPriceAtSale, 400);
  assert.ok(values.soldAt instanceof Date);
});
