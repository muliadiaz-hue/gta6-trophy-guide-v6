// View rendering for the Leonida Platinum tracker. All text comes from the
// trophy data file; this module only decides what shows and how it is laid out.
import { isEarned, counterOf } from './store.js';

export const STAGES = [
  { n: 0, title: 'Before you start', blurb: 'Spoiler protection ON. Save discipline first: a manual save at the start of every chapter plus one untouched save before the final mission — 15 manual slots plus 1 autosave. There is no mission replay and no New Game Plus, and cheats switch trophies and saving off, so keep them off on your trophy save.' },
  { n: 1, title: 'Chapter 1', blurb: 'Gone Fishing opens the story. Finish the chapter, beat Cal at fishing, clear one arcade game — and do Lucia\u2019s balcony meditation NOW: it is the one missable.' },
  { n: 2, title: 'Chapter 2', blurb: 'Jason and Lucia are both playable, so the partner trophies unlock. Kingpin Bowling, garages via Daily Driver, Scooter Bros via Moses — and start WAiNK scans, vehicle discovery and meditation spots with your partner along.' },
  { n: 3, title: 'Chapter 3', blurb: 'The Snap Gun arrives via Yasmani\u2019s Jewelry Jobs and opens jewelry robberies. Race Against Yago the moment it appears — it is time-sensitive. Three shops with your partner earns Retail Therapy.' },
  { n: 4, title: 'Chapter 4', blurb: 'That\u2019s Where The Money Is opens the bank vaults: five vaults for Maximum Withdrawal, and escaping one with your partner earns Hot Together. Add an armored truck and one illegal operation per gang.' },
  { n: 5, title: 'Side stories', blurb: 'All six side-story finales — Andy, Kenton, Billy, Randy, Tyrone and Bret — plus 8 stranger strands for Strangers & Freaks. Andy\u2019s, Billy\u2019s and Tyrone\u2019s strands do NOT count toward it; they have their own trophies. Everything here stays open after the credits.' },
  { n: 6, title: 'The 100% grind', blurb: 'Post-story checklist work: 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 vaults, all 39 illegal operations, 3 card sets, 100 WAiNK scans, 18 meditation spots, 42 shooting-range golds, 14 drone races, 52 areas, 500 Criminal Profile actions, $250k laundered, $100k spent, 8 garages, 10 Scooter Bros — then A Long Road.' },
  { n: 7, title: 'Finale', blurb: 'Load your untouched pre-finale save, finish the final mission for the second gold, and the platinum is yours.' },
];

const KIND_LABELS = {
  story: 'Story', 'side-story': 'Side story', collectible: 'Collectible',
  activity: 'Activity', robbery: 'Robbery', misc: 'Misc',
  completion: 'Completion', platinum: 'Platinum',
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

export function masked(state, trophy) {
  return state.spoiler && trophy.story && !isEarned(state, trophy.name);
}

export function matchesFilters(state, trophy, f) {
  if (f.grade !== 'all' && trophy.grade !== f.grade) return false;
  if (f.status === 'earned' && !isEarned(state, trophy.name)) return false;
  if (f.status === 'remaining' && isEarned(state, trophy.name)) return false;
  if (f.kind === 'missable' && !trophy.missable) return false;
  if (f.kind !== 'all' && f.kind !== 'missable' && !trophy.kind.includes(f.kind)) return false;
  if (f.q) {
    const hay = (trophy.name + ' ' + trophy.description).toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  return true;
}

function gradeBadge(trophy) {
  return el('span', 'grade-badge grade-' + trophy.grade, trophy.grade);
}

function kindTags(trophy) {
  const wrap = el('span', 'tags');
  for (const k of trophy.kind) wrap.appendChild(el('span', 'tag', KIND_LABELS[k] || k));
  if (trophy.hidden) wrap.appendChild(el('span', 'tag hidden-tag', 'Hidden'));
  if (trophy.missable) wrap.appendChild(el('span', 'tag missable', 'Missable'));
  return wrap;
}

function counterRow(state, trophy, onBump) {
  if (trophy.psn_count == null) return null;
  const n = counterOf(state, trophy);
  const row = el('div', 'counter');
  const minus = el('button', null, '\u2212');
  minus.type = 'button';
  minus.setAttribute('aria-label', 'Decrease progress for ' + trophy.name);
  minus.addEventListener('click', (e) => { e.stopPropagation(); onBump(trophy, -1); });
  const plus = el('button', null, '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', 'Increase progress for ' + trophy.name);
  plus.addEventListener('click', (e) => { e.stopPropagation(); onBump(trophy, 1); });
  const label = el('span', null, 'PSN progress: ' + n + ' / ' + trophy.psn_count.toLocaleString('en-US'));
  const pct = el('span', 'pct', Math.round((n / trophy.psn_count) * 100) + '%');
  row.append(minus, label, plus, pct);
  return row;
}

export function buildChecklistRow(state, trophy, selected, hooks) {
  const li = el('li', 'trophy-row' + (isEarned(state, trophy.name) ? ' earned' : '') + (selected ? ' selected' : ''));
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(state, trophy.name);
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' earned');
  box.addEventListener('click', (e) => { e.stopPropagation(); hooks.onToggle(trophy); });
  const mid = el('div');
  if (masked(state, trophy)) {
    const nameDiv = el('div', 'trophy-name');
    nameDiv.appendChild(el('span', 'masked', 'Hidden story trophy — earn it to reveal'));
    mid.appendChild(nameDiv);
    mid.appendChild(el('p', 'trophy-desc', 'Story details hidden while spoiler protection is on. Grade shown.'));
  } else {
    mid.appendChild(el('div', 'trophy-name', trophy.name));
    const desc = el('p', 'trophy-desc');
    const q = document.createElement('q');
    q.textContent = trophy.description;
    desc.appendChild(q);
    mid.appendChild(desc);
  }
  mid.appendChild(kindTags(trophy));
  const counter = counterRow(state, trophy, hooks.onBump);
  if (counter) mid.appendChild(counter);
  li.append(box, mid, gradeBadge(trophy));
  li.addEventListener('click', () => hooks.onSelect(trophy));
  return li;
}

export function paintGuide(pane, state, trophy) {
  pane.replaceChildren();
  if (!trophy) {
    pane.appendChild(el('h2', null, 'Pick a trophy'));
    pane.appendChild(el('p', 'guide-text', 'Select any trophy in the list to see its guide, its sources and — where it applies — its missable warning.'));
    return;
  }
  pane.appendChild(el('h2', null, masked(state, trophy) ? 'Hidden story trophy' : trophy.name));
  const meta = el('div', 'guide-meta');
  meta.appendChild(gradeBadge(trophy));
  for (const k of trophy.kind) meta.appendChild(el('span', 'tag', KIND_LABELS[k] || k));
  if (trophy.hidden) meta.appendChild(el('span', 'tag hidden-tag', 'Hidden'));
  pane.appendChild(meta);
  if (masked(state, trophy)) {
    pane.appendChild(el('p', 'guide-text', 'This story trophy is hidden while spoiler protection is on. Earn it in-game (or switch spoiler protection off) to reveal its official description and guide.'));
    return;
  }
  const official = el('p', 'official');
  const q = document.createElement('q');
  q.textContent = trophy.description;
  official.append('Official description: ', q);
  pane.appendChild(official);
  if (trophy.missable_note) {
    pane.appendChild(el('div', 'warn-box', '⚠ ' + trophy.missable_note));
  }
  if (trophy.guide.startsWith('METHOD UNCONFIRMED')) {
    pane.appendChild(el('div', 'unconfirmed-box', 'No confirmed unlock method at launch (Output Lag). The guide below says so plainly and invents nothing.'));
  }
  pane.appendChild(el('p', 'guide-text', trophy.guide));
  if (trophy.psn_count != null) {
    pane.appendChild(el('p', 'earn-line', 'PSN tracks this one: ' + counterOf(state, trophy) + ' / ' + trophy.psn_count.toLocaleString('en-US') + ' so far.'));
  }
  if (isEarned(state, trophy.name)) {
    const line = el('p', 'earn-line');
    const strong = el('strong', null, 'Earned ' + state.earned[trophy.name]);
    line.appendChild(strong);
    pane.appendChild(line);
  }
  const src = el('div', 'sources', 'Sources:');
  const ul = document.createElement('ul');
  for (const s of trophy.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.name;
    a.target = '_blank';
    a.rel = 'noopener';
    li.appendChild(a);
    ul.appendChild(li);
  }
  src.appendChild(ul);
  pane.appendChild(src);
}

export function nextUnearned(trophies, state) {
  const ordered = [...trophies].sort((a, b) => (a.roadmap_stage - b.roadmap_stage) || (a.id - b.id));
  return ordered.find((t) => !isEarned(state, t.name)) || null;
}

export function paintNextUp(box, trophies, state, onOpen) {
  box.replaceChildren();
  const next = nextUnearned(trophies, state);
  if (!next) {
    box.appendChild(el('h2', null, 'Platinum complete'));
    box.appendChild(el('p', null, 'Every trophy is earned. Vice Got a Price! is yours — Leonida Legend.'));
    return;
  }
  const stage = STAGES[next.roadmap_stage];
  box.appendChild(el('h2', null, 'Next up: ' + next.name));
  box.appendChild(el('p', null, 'Stage ' + next.roadmap_stage + ' — ' + stage.title + '. ' + next.description));
  const btn = el('button', null, 'Open its guide');
  btn.type = 'button';
  btn.addEventListener('click', () => onOpen(next));
  box.appendChild(btn);
}

export function paintRoadmap(wrap, trophies, state, onOpen) {
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.roadmap_stage === stage.n);
    const earned = members.filter((t) => isEarned(state, t.name)).length;
    const card = el('div', 'stage');
    const h = el('h3', null, 'Stage ' + stage.n + ' — ' + stage.title + '  ');
    h.appendChild(el('span', 'stage-count', earned + ' / ' + members.length + ' earned'));
    card.appendChild(h);
    card.appendChild(el('p', null, stage.blurb));
    const chips = el('div', 'chips');
    for (const t of members) {
      const chip = el('button', 'chip' + (isEarned(state, t.name) ? ' earned' : ''), (isEarned(state, t.name) ? '✓ ' : '') + (masked(state, t) ? 'Hidden story trophy' : t.name));
      chip.type = 'button';
      chip.addEventListener('click', () => onOpen(t));
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    wrap.appendChild(card);
  }
}

export function paintMissables(wrap, trophies, state) {
  wrap.replaceChildren();
  const status = el('p', 'lede span-all', state.spoiler
    ? 'Spoiler protection is ON — story trophy names stay hidden in the Checklist until earned.'
    : 'Spoiler protection is OFF — story trophy names are shown in the Checklist.');
  wrap.appendChild(status);
  const risk = trophies.find((t) => t.name === 'Positive Mental Attitude');
  const timed = trophies.find((t) => t.name === 'Strangers & Freaks');
  const riskCard = el('div', 'card risk');
  riskCard.appendChild(el('h3', null, '⚠ Confirmed risk — ' + risk.name));
  riskCard.appendChild(el('p', null, risk.missable_note));
  riskCard.appendChild(el('p', null, risk.guide));
  wrap.appendChild(riskCard);
  const timedCard = el('div', 'card');
  timedCard.appendChild(el('h3', null, '⏱ Time-sensitive — Race Against Yago'));
  timedCard.appendChild(el('p', null, 'Not confirmed missable, but do it the moment it appears in Chapter 3 (Yago\u2019s street-racing strand, hourglass icon). It counts toward ' + timed.name + ' (8 strands). Save first, then race.'));
  timedCard.appendChild(el('p', null, 'Chapter 3 is also when the Snap Gun arrives and jewelry robberies open — a busy chapter, so keep a save from its start.'));
  wrap.appendChild(timedCard);
}

function counterCard(title, earned, total) {
  const card = el('div', 'counter-card');
  card.appendChild(el('h4', null, title));
  card.appendChild(el('div', 'big', earned + ' / ' + total));
  const bar = el('div', 'mini-bar');
  bar.appendChild(el('div', null, ''));
  bar.firstChild.style.width = (total ? Math.round((earned / total) * 100) : 0) + '%';
  card.appendChild(bar);
  return card;
}

export function paintProgress(wrap, trophies, state) {
  wrap.replaceChildren();
  const earned = trophies.filter((t) => isEarned(state, t.name));
  wrap.appendChild(counterCard('All trophies', earned.length, trophies.length));
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = earned.filter((t) => t.grade === grade).length;
    wrap.appendChild(counterCard(grade, got, total));
  }
  const counted = trophies.filter((t) => t.psn_count != null);
  const started = counted.filter((t) => counterOf(state, t) > 0).length;
  wrap.appendChild(counterCard('PSN counters started', started, counted.length));
  const hiddenGot = earned.filter((t) => t.hidden).length;
  wrap.appendChild(counterCard('Hidden trophies found', hiddenGot, 28));
}
