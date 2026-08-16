export const REGIONS = [
  { key:'sunshower', name:'SUNSHOWER MEADOWS', hue:198, rain:.76, accent:'cyan' },
  { key:'moonrain', name:'MOONLIT RAIN', hue:226, rain:.82, accent:'blue' },
  { key:'thunder', name:'THUNDER GARDENS', hue:248, rain:.90, accent:'violet' },
  { key:'aurora', name:'AURORA SEA', hue:190, rain:.78, accent:'aurora' },
  { key:'golden', name:'GOLDEN SKY', hue:36, rain:.70, accent:'gold' },
  { key:'cloudkingdom', name:'CLOUD KINGDOM', hue:210, rain:.80, accent:'silver' }
];

export function getRegionForLevel(levelNumber) {
  const zeroBased = Math.max(0, levelNumber - 1);
  const regionIndex = Math.floor(zeroBased / 10) % REGIONS.length;
  const cycle = Math.floor(zeroBased / (REGIONS.length * 10));
  const base = REGIONS[regionIndex];
  return {
    ...base,
    cycle,
    chapter: regionIndex + 1 + cycle * REGIONS.length,
    displayName: cycle ? `${base.name} ${cycle + 1}` : base.name
  };
}
