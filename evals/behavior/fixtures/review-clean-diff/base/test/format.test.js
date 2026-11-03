import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice } from '../src/format.js';

test('formatPrice shows two decimals with a dollar sign', () => {
  assert.equal(formatPrice(3), '$3.00');
  assert.equal(formatPrice(2.5), '$2.50');
});
