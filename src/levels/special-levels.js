const SPECIALS = [
  { key:'rainbowRush', name:'RAINBOW RUSH', objective:'prisms', rainbowBias:.42, springBias:.10, goldenBias:.04, rareGolden:true },
  { key:'goldenShower', name:'GOLDEN SHOWER', objective:'cloudLandings', rainbowBias:.10, springBias:.12, goldenBias:.34, rareGolden:true },
  { key:'cloudFestival', name:'CLOUD FESTIVAL', objective:'springBounces', rainbowBias:.16, springBias:.34, goldenBias:.08, rareGolden:false },
  { key:'auroraNight', name:'AURORA NIGHT', objective:'beacons', rainbowBias:.25, springBias:.12, goldenBias:.06, rareAurora:true, hueOverride:205, rainOverride:.84 },
  { key:'prismRain', name:'PRISM RAIN', objective:'prisms', rainbowBias:.20, springBias:.15, goldenBias:.10, extraPrisms:3, rareGolden:true }
];

export function getSpecialForLevel(levelNumber) {
  if (levelNumber < 5 || levelNumber % 5 !== 0) return null;
  const index = Math.floor(levelNumber / 5 - 1) % SPECIALS.length;
  return { ...SPECIALS[index] };
}
