export const OBSTACLE_TYPES = {
  lightning: { label: 'Lightning Column' },
  hail: { label: 'Hail Orb' },
  rainCurtain: { label: 'Rain Curtain' },
  stormSpark: { label: 'Storm Spark' }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function chooseType(levelNumber, slot, special) {
  if (special?.key === 'auroraNight' && slot === 0) return 'lightning';
  if (special?.key === 'prismRain' && slot === 0) return 'rainCurtain';
  if (special?.key === 'goldenShower' && slot === 0) return 'hail';
  return ['rainCurtain', 'hail', 'lightning', 'stormSpark'][(levelNumber + slot) % 4];
}

export function generateObstacles({ levelNumber, platforms, rng, special }) {
  if (levelNumber < 4 || platforms.length < 5) return [];

  const pairs = [];
  for (let i = 1; i < platforms.length - 2; i++) {
    const a = platforms[i];
    const b = platforms[i + 1];
    const gapStart = a[0] + a[2];
    const gapEnd = b[0];
    const gap = gapEnd - gapStart;
    if (gap >= 52) pairs.push({ a, b, gapStart, gapEnd, gap, index: i });
  }
  if (!pairs.length) return [];

  // Obstacles add rhythm rather than a steep difficulty curve: 2 early, 3 later,
  // and never more than 4 in a generated sky.
  const count = Math.min(4, 2 + Math.floor(Math.max(0, levelNumber - 16) / 14));
  const obstacles = [];

  for (let slot = 0; slot < Math.min(count, pairs.length); slot++) {
    const pairIndex = Math.min(pairs.length - 1, Math.floor((slot + 1) * pairs.length / (count + 1)));
    const pair = pairs[pairIndex];
    const type = chooseType(levelNumber, slot, special);
    const centerX = pair.gapStart + pair.gap * (.42 + rng() * .16);
    const cloudY = Math.min(pair.a[1], pair.b[1]);

    if (type === 'lightning') {
      const top = 178 + Math.round(rng() * 28);
      obstacles.push({
        type,
        x: Math.round(centerX),
        y: top,
        w: 28,
        h: Math.max(150, Math.round(cloudY - top - 18)),
        phase: rng() * 3.4,
        cycle: 3.25 + rng() * .45,
        strikeFor: .30,
        warnFor: .78
      });
    } else if (type === 'hail') {
      obstacles.push({
        type,
        x: Math.round(centerX),
        y: Math.round(clamp(cloudY - 102 - rng() * 30, 245, 430)),
        r: 21 + Math.round(rng() * 4),
        amp: 28 + Math.round(rng() * 18),
        speed: .72 + rng() * .28,
        phase: rng() * Math.PI * 2
      });
    } else if (type === 'stormSpark') {
      obstacles.push({
        type,
        x: Math.round(centerX),
        y: Math.round(clamp(cloudY - 110 - rng() * 24, 250, 420)),
        r: 16 + Math.round(rng() * 3),
        orbit: 24 + Math.round(rng() * 14),
        speed: .9 + rng() * .35,
        phase: rng() * Math.PI * 2
      });
    } else {
      const top = 168 + Math.round(rng() * 24);
      obstacles.push({
        type,
        x: Math.round(centerX - 40),
        y: top,
        w: Math.min(84, Math.max(58, Math.round(pair.gap * .62))),
        h: Math.max(170, Math.round(cloudY - top + 8)),
        phase: rng() * Math.PI * 2,
        slow: .58
      });
    }
  }

  return obstacles;
}

export function obstaclePosition(obstacle, timeSeconds) {
  if (obstacle.type === 'hail') {
    return {
      x: obstacle.x + Math.sin(timeSeconds * obstacle.speed + obstacle.phase) * obstacle.amp,
      y: obstacle.y + Math.cos(timeSeconds * obstacle.speed * .72 + obstacle.phase) * 14
    };
  }
  if (obstacle.type === 'stormSpark') {
    const a = timeSeconds * obstacle.speed + obstacle.phase;
    return {
      x: obstacle.x + Math.cos(a) * obstacle.orbit,
      y: obstacle.y + Math.sin(a * .92) * obstacle.orbit * .62
    };
  }
  return { x: obstacle.x, y: obstacle.y };
}

export function lightningState(obstacle, timeSeconds) {
  if (obstacle.type !== 'lightning') return { mode: 'idle', strength: 0 };
  const cycle = obstacle.cycle || 3.4;
  const t = (timeSeconds + obstacle.phase) % cycle;
  const warnFor = obstacle.warnFor || .78;
  const strikeFor = obstacle.strikeFor || .30;
  if (t < warnFor) return { mode: 'warning', strength: t / warnFor };
  if (t < warnFor + strikeFor) return { mode: 'active', strength: 1 - (t - warnFor) / strikeFor };
  return { mode: 'idle', strength: 0 };
}
