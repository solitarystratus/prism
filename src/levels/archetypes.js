export const ENDLESS_NAMES = [
  'Moonlit Drizzle', 'Nimbus Crossing', 'Rainbow Basin', 'Cloudglass Run', 'Aurora Shower',
  'Silver Horizon', 'Prism Monsoon', 'Dewlight Passage', 'Rainveil Gardens', 'Skyglass Current'
];

export const ENDLESS_REWARDS = ['Nimbus Token', 'Prism Bloom', 'Rainlight Crest', 'Cloudstep Charm', 'Aurora Drop'];

export const ARCHETYPES = [
  { key:'archipelago', name:'ARCHIPELAGO', springEvery:4, gap:[76,118], width:[185,305] },
  { key:'stairway', name:'RAIN STAIRWAY', springEvery:4, gap:[72,112], width:[190,300] },
  { key:'zigzag', name:'ZIGZAG SKY', springEvery:3, gap:[76,116], width:[180,285] },
  { key:'valley', name:'CLOUD VALLEY', springEvery:4, gap:[70,108], width:[205,320] },
  { key:'skybridge', name:'SKY BRIDGE', springEvery:5, gap:[66,100], width:[230,340] },
  { key:'waterfall', name:'RAIN WATERFALL', springEvery:3, gap:[72,112], width:[190,300] }
];

export function archetypeY(key, i) {
  if (key === 'archipelago') return 458 + Math.sin(i * .9) * 58;
  if (key === 'stairway') return 505 - (i % 6) * 27;
  if (key === 'zigzag') return [505, 438, 500, 414, 490, 430][i % 6];
  if (key === 'valley') return [405, 430, 465, 500, 520, 500, 465, 430][i % 8];
  if (key === 'skybridge') return 478 + Math.sin(i * .42) * 26;
  return [400, 430, 465, 500, 520, 470][i % 6];
}
