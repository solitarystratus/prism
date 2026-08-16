export const SAVE_KEY = 'prismfall-save-v1';

export function normalizeSave(raw = {}) {
  const save = {
    unlocked: 1,
    totalPrism: 0,
    best: {},
    reward: 'silver',
    stars: {},
    drops: 0,
    rare: { golden: 0, aurora: 0 },
    rareClaims: {},
    rarePerks: { goldenTier: 0, auroraTier: 0 },
    auras: ['mist'],
    equippedAura: 'mist',
    trails: ['silver'],
    equippedTrail: 'silver',
    ...raw
  };

  save.best = save.best && typeof save.best === 'object' ? save.best : {};
  save.stars = save.stars && typeof save.stars === 'object' ? save.stars : {};
  save.rare = { golden: 0, aurora: 0, ...(save.rare || {}) };
  save.rareClaims = save.rareClaims && typeof save.rareClaims === 'object' ? save.rareClaims : {};
  save.rarePerks = { goldenTier: 0, auroraTier: 0, ...(save.rarePerks || {}) };
  save.auras = Array.isArray(save.auras) && save.auras.length ? save.auras : ['mist'];
  save.trails = Array.isArray(save.trails) && save.trails.length ? save.trails : ['silver'];
  save.equippedAura = save.equippedAura || save.auras[save.auras.length - 1] || 'mist';
  save.equippedTrail = save.equippedTrail || save.trails[save.trails.length - 1] || 'silver';
  save.drops = Number.isFinite(save.drops) ? save.drops : 0;
  save.unlocked = Number.isFinite(save.unlocked) ? Math.max(1, Math.floor(save.unlocked)) : 1;
  return save;
}

export function loadSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {});
  } catch {
    return normalizeSave();
  }
}

export function persistSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Storage can fail in private/restricted browsing; gameplay should continue.
  }
}
