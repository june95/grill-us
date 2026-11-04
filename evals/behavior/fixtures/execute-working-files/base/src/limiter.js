import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../config/limits.json', import.meta.url), 'utf8'));
const windows = new Map();

/** 고정 창(windowSeconds) 안의 요청 수가 perMinute를 넘으면 거부한다. */
export function allow(client, now = Date.now()) {
  const windowMs = config.windowSeconds * 1000;
  const start = Math.floor(now / windowMs) * windowMs;
  const entry = windows.get(client);
  if (!entry || entry.start !== start) {
    windows.set(client, { start, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= config.perMinute;
}
