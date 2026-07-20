// Parse a human range string like "1-3, 5, 8-10" into groups of 0-based page
// indices. Each comma-separated token becomes one output group. Invalid or
// out-of-bounds tokens are ignored.

export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const raw of input.split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const m = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      const pages: number[] = [];
      for (let p = a; p <= b; p++) if (p >= 1 && p <= total) pages.push(p - 1);
      if (pages.length) groups.push(pages);
      continue;
    }
    const single = parseInt(token, 10);
    if (!Number.isNaN(single) && single >= 1 && single <= total) groups.push([single - 1]);
  }
  return groups;
}

/** Fixed-size chunks: [0..N-1], [N..2N-1], ... */
export function everyNGroups(total: number, n: number): number[][] {
  if (n < 1) return [];
  const groups: number[][] = [];
  for (let i = 0; i < total; i += n) {
    const g: number[] = [];
    for (let j = i; j < Math.min(i + n, total); j++) g.push(j);
    groups.push(g);
  }
  return groups;
}

/** One page per file. */
export function eachPageGroups(total: number): number[][] {
  return Array.from({ length: total }, (_, i) => [i]);
}
