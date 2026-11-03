import test from 'node:test';
import assert from 'node:assert/strict';
import { greet } from '../src/greet.js';

test('greet prefixes the name and ends with an exclamation mark', () => {
  assert.equal(greet('Ada'), 'Hello Ada!');
});
