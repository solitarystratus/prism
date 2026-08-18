export const SAVE_KEY = 'prismfall-save-v1';
export const SAVE_SCHEMA = 3;
export const SAVE_EXPORT_FORMAT = 'prismfall-save';

export function normalizeSave(raw = {}) {
  const save = {
    schemaVersion: SAVE_SCHEMA,
    unlocked: 1,
    totalPrism: 0,
    best: {},
    reward: 'silver',
    stars: {},
    drops: 0,
    rare: { golden: 0, aurora: 0 },
    rareClaims: {},
    rarePerks: { goldenTier: 0, auroraTier: 0 },
    bestCombo: 0,
    rainbowRings: 0,
    auras: ['mist'],
    equippedAura: 'mist',
    trails: ['silver'],
    equippedTrail: 'silver',
    settings: { muted: false, reducedMotion: false },
    ...raw
  };

  save.schemaVersion = SAVE_SCHEMA;
  save.best = save.best && typeof save.best === 'object' ? save.best : {};
  save.stars = save.stars && typeof save.stars === 'object' ? save.stars : {};
  save.rare = { golden: 0, aurora: 0, ...(save.rare || {}) };
  save.rareClaims = save.rareClaims && typeof save.rareClaims === 'object' ? save.rareClaims : {};
  save.rarePerks = { goldenTier: 0, auroraTier: 0, ...(save.rarePerks || {}) };
  save.auras = Array.isArray(save.auras) && save.auras.length ? save.auras : ['mist'];
  save.trails = Array.isArray(save.trails) && save.trails.length ? save.trails : ['silver'];
  save.equippedAura = save.equippedAura || save.auras[save.auras.length - 1] || 'mist';
  save.equippedTrail = save.equippedTrail || save.trails[save.trails.length - 1] || 'silver';
  save.settings = { muted: false, reducedMotion: false, ...(save.settings || {}) };
  save.settings.muted = Boolean(save.settings.muted);
  save.settings.reducedMotion = Boolean(save.settings.reducedMotion);
  save.drops = Number.isFinite(save.drops) ? Math.max(0, save.drops) : 0;
  save.totalPrism = Number.isFinite(save.totalPrism) ? Math.max(0, Math.floor(save.totalPrism)) : 0;
  save.bestCombo = Number.isFinite(save.bestCombo) ? Math.max(0, Math.floor(save.bestCombo)) : 0;
  save.rainbowRings = Number.isFinite(save.rainbowRings) ? Math.max(0, Math.floor(save.rainbowRings)) : 0;
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(save)));
    return true;
  } catch {
    // Storage can fail in private/restricted browsing; gameplay should continue.
    return false;
  }
}

export function exportSaveText(save) {
  return JSON.stringify({
    format: SAVE_EXPORT_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    save: normalizeSave(save)
  }, null, 2);
}

export function importSaveText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const candidate = parsed?.format === SAVE_EXPORT_FORMAT ? parsed.save : parsed;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new Error('That file does not contain a Prismfall save.');
  }

  const normalized = normalizeSave(candidate);
  if (!persistSave(normalized)) throw new Error('This browser blocked local save storage.');
  return normalized;
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
