import { generateEndlessLevel } from '../src/levels/generator.js';

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const supportedObstacles = new Set(['lightning', 'hail', 'rainCurtain', 'stormSpark']);
const supportedPlatforms = new Set(['cloud', 'spring', 'drift', 'rainbow', 'golden']);

let specialCount = 0;
let rareCount = 0;
let maxGap = 0;

for (let index = 3; index < 253; index++) {
  const level = generateEndlessLevel(index, 3);
  const number = index + 1;

  assert(level.width >= 4500, `Level ${number}: invalid width`);
  assert(level.platforms.length >= 12, `Level ${number}: too few platforms`);
  assert(level.obstacles.length <= 4, `Level ${number}: obstacle cap exceeded`);
  assert(level.rainbowRings.length >= 2 && level.rainbowRings.length <= 5, `Level ${number}: invalid ring count`);
  assert(level.checkpoints.length >= 1, `Level ${number}: missing checkpoints`);
  assert(level.platforms.every(p => supportedPlatforms.has(p[4])), `Level ${number}: unsupported platform type`);
  assert(level.obstacles.every(o => supportedObstacles.has(o.type)), `Level ${number}: unsupported obstacle type`);
  assert(level.rainbowRings.every(r => r[1] >= 240 && r[1] <= 440), `Level ${number}: unreachable rainbow ring height`);

  const sorted = [...level.platforms].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i][0] - (sorted[i - 1][0] + sorted[i - 1][2]);
    maxGap = Math.max(maxGap, gap);
    assert(gap <= 145, `Level ${number}: platform gap too large (${gap})`);
  }

  if (level.primary.type === 'beacons') assert(level.beacons.length >= level.primary.target, `Level ${number}: beacon objective impossible`);
  if (level.primary.type === 'prisms') assert(level.prisms.length >= level.primary.target, `Level ${number}: prism objective impossible`);
  if (level.primary.type === 'springBounces') {
    const springs = level.platforms.filter(p => p[4] === 'spring').length;
    assert(springs >= level.primary.target, `Level ${number}: spring objective impossible`);
  }

  if (level.special) specialCount++;
  rareCount += level.rarePrisms.length;
}

assert(specialCount > 20, 'Special levels did not generate often enough');
assert(rareCount > 30, 'Rare prisms did not generate often enough');
console.log(`Smoke passed: 250 endless levels, ${specialCount} specials, ${rareCount} rare prisms, max gap ${maxGap}.`);

// Save portability round-trip with a tiny localStorage mock.
const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key)
};
const { normalizeSave, exportSaveText, importSaveText, loadSave, clearSave } = await import('../src/core/storage.js');
const fixture = normalizeSave({ unlocked: 47, drops: 3210, rare: { golden: 9, aurora: 3 }, settings: { muted: true, reducedMotion: true } });
const exported = exportSaveText(fixture);
const imported = importSaveText(exported);
assert(imported.unlocked === 47 && imported.drops === 3210, 'Save export/import round-trip failed');
assert(loadSave().settings.reducedMotion === true, 'Imported settings did not persist');
clearSave();
assert(loadSave().unlocked === 1, 'Save reset did not restore defaults');
console.log('Save portability smoke passed.');
