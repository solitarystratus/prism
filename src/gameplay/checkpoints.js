export function buildCheckpoints(width, platforms) {
  if (width < 3600) return [];
  const count = Math.max(2, Math.min(3, Math.floor(width / 1700)));
  const usable = platforms.filter((p, i) => i > 0 && i < platforms.length - 1 && p[2] >= 170);
  const result = [];

  for (let i = 1; i <= count; i++) {
    const targetX = width * (i / (count + 1));
    let best = usable[0];
    let bestDistance = Infinity;
    for (const p of usable) {
      const center = p[0] + p[2] * .5;
      const distance = Math.abs(center - targetX);
      if (distance < bestDistance) {
        best = p;
        bestDistance = distance;
      }
    }
    if (best) result.push([Math.round(best[0] + best[2] * .5), Math.round(best[1] - 42)]);
  }
  return result;
}
