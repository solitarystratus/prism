export const PLATFORM_TYPES = {
  cloud: { label:'Cloud' },
  spring: { label:'Spring Cloud' },
  drift: { label:'Drift Cloud' },
  rainbow: { label:'Rainbow Cloud' },
  golden: { label:'Golden Cloud' }
};

export function choosePlatformType({ step, springEvery, rng, special }) {
  if ((step + 1) % springEvery === 0) return 'spring';
  const roll = rng();
  const springBias = special?.springBias ?? .06;
  const rainbowBias = special?.rainbowBias ?? .10;
  const goldenBias = special?.goldenBias ?? .05;

  if (roll < goldenBias) return 'golden';
  if (roll < goldenBias + rainbowBias) return 'rainbow';
  if (roll < goldenBias + rainbowBias + springBias) return 'spring';
  if (roll < goldenBias + rainbowBias + springBias + .13) return 'drift';
  return 'cloud';
}

export function platformHeight(type) {
  return type === 'spring' ? 42 : type === 'drift' ? 38 : 40;
}

export function makePlatformMeta(type, rng = Math.random) {
  if (type === 'drift') {
    return { driftAmp: 34 + Math.round(rng() * 30), driftSpeed: .55 + rng() * .35, driftPhase: rng() * Math.PI * 2 };
  }
  return {};
}

export function updatePlatformMotion(platform, timeSeconds) {
  if (platform.type !== 'drift') {
    platform.x = platform.baseX;
    return;
  }
  platform.x = platform.baseX + Math.sin(timeSeconds * platform.driftSpeed + platform.driftPhase) * platform.driftAmp;
}
