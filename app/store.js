// Save state for the Leonida Platinum tracker: earned dates, PSN counters,
// spoiler preference. One key, one versioned shape, local storage only.
const KEY = 'gta6-trophy-guide-v1';

export function blankState() {
  return { version: 1, earned: {}, progress: {}, spoiler: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankState();
    return {
      version: 1,
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      spoiler: parsed.spoiler !== false,
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isEarned(state, name) {
  return Object.prototype.hasOwnProperty.call(state.earned, name);
}

export function toggleEarned(state, name) {
  if (isEarned(state, name)) {
    delete state.earned[name];
  } else {
    state.earned[name] = new Date().toISOString().slice(0, 10);
  }
  saveState(state);
}

export function counterOf(state, trophy) {
  if (trophy.psn_count == null) return null;
  const n = state.progress[trophy.name];
  return typeof n === 'number' && n >= 0 ? Math.min(n, trophy.psn_count) : 0;
}

export function bumpCounter(state, trophy, delta) {
  if (trophy.psn_count == null) return;
  const next = Math.max(0, Math.min(trophy.psn_count, counterOf(state, trophy) + delta));
  state.progress[trophy.name] = next;
  saveState(state);
}

// Import keeps only names that exist in the official 55 and reports the counts.
export function importState(state, incoming, knownNames) {
  const kept = { earned: 0, progress: 0, skipped: 0 };
  if (incoming && typeof incoming === 'object') {
    const earned = incoming.earned && typeof incoming.earned === 'object' ? incoming.earned : {};
    for (const name of Object.keys(earned)) {
      if (knownNames.has(name)) { state.earned[name] = earned[name]; kept.earned++; }
      else kept.skipped++;
    }
    const progress = incoming.progress && typeof incoming.progress === 'object' ? incoming.progress : {};
    for (const name of Object.keys(progress)) {
      if (knownNames.has(name) && typeof progress[name] === 'number') {
        state.progress[name] = Math.max(0, progress[name]); kept.progress++;
      } else kept.skipped++;
    }
  }
  if (incoming && incoming.spoiler === false) state.spoiler = false;
  if (incoming && incoming.spoiler === true) state.spoiler = true;
  saveState(state);
  return kept;
}

export function exportState(state) {
  return JSON.stringify({ version: 1, earned: state.earned, progress: state.progress, spoiler: state.spoiler }, null, 2);
}
