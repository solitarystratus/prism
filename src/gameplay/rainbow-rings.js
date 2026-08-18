const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function generateRainbowRings({ levelNumber, platforms, rng, special }) {
  if (levelNumber < 4 || platforms.length < 5) return [];

  const usable = platforms.slice(1, -1).filter(p => p[2] >= 145);
  if (!usable.length) return [];

  const baseCount = 2 + (levelNumber % 2);
  const count = Math.min(5, baseCount + (special?.key === 'rainbowRush' ? 2 : 0));
  const rings = [];

  for (let i = 0; i < count; i++) {
    const idx = Math.min(usable.length - 1, Math.floor((i + 1) * usable.length / (count + 1)));
    const p = usable[idx];
    const x = Math.round(p[0] + p[2] * (.42 + rng() * .16));
    // Keep rings deliberately reachable with the current jump tuning.
    const y = Math.round(clamp(p[1] - 100 - rng() * 16, 248, 430));
    const radius = 31 + Math.round(rng() * 4);
    const reward = special?.key === 'rainbowRush' ? 40 : 30;
    rings.push([x, y, radius, reward]);
  }

  return rings;
}
