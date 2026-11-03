import test from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../src/sum.js';

test('sum adds numbers and returns 0 for an empty list', () => {
  assert.equal(sum([]), 0);
  assert.equal(sum([1, 2, 3]), 6);
});
