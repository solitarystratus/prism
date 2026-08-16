import { ARCHETYPES, ENDLESS_NAMES, ENDLESS_REWARDS, archetypeY } from './archetypes.js';
import { getRegionForLevel } from './regions.js';
import { getSpecialForLevel } from './special-levels.js';
import { makePrimary, buildBonusObjectives } from '../progression/objectives.js';
import { choosePlatformType, platformHeight, makePlatformMeta } from '../gameplay/platforms.js';
import { buildCheckpoints } from '../gameplay/checkpoints.js';
import { generateObstacles } from '../gameplay/obstacles.js';
import { regionAtmosphere } from '../visuals/region-effects.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateEndlessLevel(index, storyLevelCount = 3) {
  const levelNumber = index + 1;
  const tier = index - storyLevelCount;
  const rng = seededRandom(0x9E3779B9 ^ Math.imul(levelNumber, 0x85EBCA6B));
  const archetype = ARCHETYPES[((tier % ARCHETYPES.length) + ARCHETYPES.length) % ARCHETYPES.length];
  const region = getRegionForLevel(levelNumber);
  const special = getSpecialForLevel(levelNumber);
  const atmosphere = regionAtmosphere(region, levelNumber);
  const primaryType = special?.objective || ['prisms','beacons','cloudLandings','springBounces'][((tier % 4) + 4) % 4];
  const primary = makePrimary(primaryType, Math.max(0, tier));
  const width = 4800 + (((tier % 3) + 3) % 3) * 220;
  const platforms = [[30, 520, 430, 44, 'cloud', {}]];
  let cursor = 460;
  let lastY = 520;
  let step = 0;

  while (cursor < width - 700) {
    const gap = archetype.gap[0] + Math.floor(rng() * (archetype.gap[1] - archetype.gap[0]));
    const w = archetype.width[0] + Math.floor(rng() * (archetype.width[1] - archetype.width[0]));
    const targetY = archetypeY(archetype.key, step);
    const y = Math.round(clamp(targetY, Math.max(360, lastY - 72), Math.min(520, lastY + 72)));
    const x = cursor + gap;
    const type = choosePlatformType({ step, springEvery:archetype.springEvery, rng, special });
    platforms.push([x, y, w, platformHeight(type), type, makePlatformMeta(type, rng)]);
    cursor = x + w;
    lastY = y;
    step++;
  }

  const finalX = width - 520;
  if (finalX - cursor > 130) {
    const bridgeX = cursor + 70;
    const bridgeY = Math.round(clamp((lastY + 500) * .5, 400, 510));
    platforms.push([bridgeX, bridgeY, Math.min(240, Math.max(150, finalX - bridgeX - 70)), 34, 'cloud', {}]);
  }
  platforms.push([finalX, 500, 480, 44, 'cloud', {}]);

  const usablePlatforms = platforms.filter(p => p[2] >= 150);
  const normalPrismCount = primary.type === 'prisms' ? primary.target : 7 + (Math.max(0, tier) % 2);
  const prismCount = normalPrismCount + (special?.extraPrisms || 0);
  const prisms = [];
  for (let i = 0; i < prismCount; i++) {
    const idx = Math.min(usablePlatforms.length - 1, Math.floor((i + 1) * usablePlatforms.length / (prismCount + 1)));
    const p = usablePlatforms[idx];
    prisms.push([
      Math.round(p[0] + p[2] * (.35 + rng() * .3)),
      Math.round(p[1] - 78 - rng() * 20)
    ]);
  }

  const beacons = [];
  if (primary.type === 'beacons') {
    for (let i = 0; i < primary.target; i++) {
      const idx = Math.min(usablePlatforms.length - 1, Math.floor((i + 1) * usablePlatforms.length / (primary.target + 1)));
      const p = usablePlatforms[idx];
      beacons.push([Math.round(p[0] + p[2] * .55), Math.round(p[1] - 58)]);
    }
  }

  const rarePrisms = [];
  const rareSpot = offset => {
    const p = usablePlatforms[Math.min(usablePlatforms.length - 2, Math.max(1, Math.floor(usablePlatforms.length * offset)))];
    return [Math.round(p[0] + p[2] * .72), Math.round(p[1] - 74)];
  };
  if (special?.rareGolden || levelNumber % 3 === 0 || rng() < .24) {
    const [x,y] = rareSpot(.62 + rng() * .12);
    rarePrisms.push([x,y,'golden']);
  }
  if (special?.rareAurora || levelNumber % 11 === 0 || rng() < .045) {
    const [x,y] = rareSpot(.38 + rng() * .12);
    rarePrisms.push([x,y,'aurora']);
  }

  const stormCount = 4 + (Math.max(0, tier) % 3);
  const storms = [];
  for (let i = 0; i < stormCount; i++) {
    const idx = Math.min(platforms.length - 2, 2 + Math.floor((i + .65) * (platforms.length - 3) / stormCount));
    const p = platforms[idx];
    storms.push([
      Math.round(p[0] + p[2] + 42 + rng() * 36),
      Math.round(clamp(p[1] - 145 + (rng() - .5) * 90, 245, 520)),
      Math.round(84 + rng() * 14)
    ]);
  }

  const currents = [];
  for (let i = 0; i < 3; i++) {
    const x = Math.round(width * ((i + 1) / 4) - 80);
    currents.push([x, 120 + (i % 2) * 40, 170, 330, i % 2 ? -250 : 250]);
  }

  const objectives = buildBonusObjectives(Math.max(0, tier), primary.type);
  const checkpoints = buildCheckpoints(width, platforms);
  const obstacles = generateObstacles({ levelNumber, platforms, rng, special });

  return {
    name: `${special ? `${special.name} • ` : ''}${ENDLESS_NAMES[((tier % ENDLESS_NAMES.length) + ENDLESS_NAMES.length) % ENDLESS_NAMES.length]} ${levelNumber}`,
    hue: special?.hueOverride ?? atmosphere.hue,
    rainIntensity: special?.rainOverride ?? atmosphere.rain,
    goal: normalPrismCount,
    reward: ENDLESS_REWARDS[((tier % ENDLESS_REWARDS.length) + ENDLESS_REWARDS.length) % ENDLESS_REWARDS.length],
    width,
    start: [160, 420],
    portal: [width - 240, 230],
    platforms,
    prisms,
    rarePrisms,
    beacons,
    checkpoints,
    obstacles,
    storms,
    currents,
    objectives,
    primary,
    archetype,
    region,
    special
  };
}
