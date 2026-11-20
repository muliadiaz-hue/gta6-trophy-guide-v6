// Boot for the Leonida Platinum tracker: loads the trophy data, wires the
// tabs, filters, checklist, guide pane, roadmap, missables and save tools.
import { loadState, saveState, toggleEarned, bumpCounter, importState, exportState } from './store.js';
import {
  STAGES, masked, matchesFilters, buildChecklistRow, paintGuide,
  paintNextUp, paintRoadmap, paintMissables, paintProgress,
} from './render.js';

const state = loadState();
let trophies = [];
let selectedId = null;
const filters = { q: '', kind: 'all', grade: 'all', status: 'all' };

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const paneEl = $('guidePane');

function selectedTrophy() {
  return trophies.find((t) => t.id === selectedId) || null;
}

function renderHeader() {
  const earned = trophies.filter((t) => Object.prototype.hasOwnProperty.call(state.earned, t.name)).length;
  $('earnedCount').textContent = earned;
  $('barFill').style.width = Math.round((earned / trophies.length) * 100) + '%';
  $('platinumPct').textContent = Math.round((earned / trophies.length) * 100) + '%';
  const golds = trophies.filter((t) => t.grade !== 'platinum' && Object.prototype.hasOwnProperty.call(state.earned, t.name)).length;
  $('pointsLine').textContent = golds + ' of 54 non-platinum trophies earned';
}

function renderChecklist() {
  const shown = trophies.filter((t) => matchesFilters(state, t, filters));
  listEl.replaceChildren();
  for (const t of shown) {
    listEl.appendChild(buildChecklistRow(state, t, t.id === selectedId, {
      onToggle: (tr) => { toggleEarned(state, tr.name); refresh(); },
      onBump: (tr, d) => { bumpCounter(state, tr, d); refresh(); },
      onSelect: (tr) => { selectedId = tr.id; refresh(); },
    }));
  }
  $('emptyNote').hidden = shown.length !== 0;
  $('resultCount').textContent = shown.length + ' of 55 trophies';
  paintGuide(paneEl, state, selectedTrophy());
}

function refresh() {
  renderHeader();
  renderChecklist();
  paintNextUp($('nextUp'), trophies, state, (t) => { selectedId = t.id; switchView('checklist'); refresh(); });
  paintRoadmap($('roadmapStages'), trophies, state, (t) => { selectedId = t.id; switchView('checklist'); refresh(); });
  paintMissables($('missableCards'), trophies, state);
  paintProgress($('progressCounters'), trophies, state);
}

function switchView(name) {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === name);
  }
  for (const view of document.querySelectorAll('.view')) {
    view.hidden = view.id !== 'view-' + name;
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  selectedId = trophies.find((t) => t.name === 'Positive Mental Attitude').id;

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
  $('searchBox').addEventListener('input', (e) => { filters.q = e.target.value.trim(); renderChecklist(); });
  $('kindFilter').addEventListener('change', (e) => { filters.kind = e.target.value; renderChecklist(); });
  $('gradeFilter').addEventListener('change', (e) => { filters.grade = e.target.value; renderChecklist(); });
  $('statusFilter').addEventListener('change', (e) => { filters.status = e.target.value; renderChecklist(); });
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveState(state);
    refresh();
  });

  $('exportBtn').addEventListener('click', () => download('gta6-trophy-progress.json', exportState(state)));
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const incoming = JSON.parse(await file.text());
      const known = new Set(trophies.map((t) => t.name));
      const kept = importState(state, incoming, known);
      $('importReport').textContent = 'Imported ' + kept.earned + ' earned trophies and ' + kept.progress + ' progress counters' +
        (kept.skipped ? ' (' + kept.skipped + ' unknown entries skipped)' : '') + '.';
      $('spoilerToggle').checked = state.spoiler;
    } catch {
      $('importReport').textContent = 'That file could not be read as progress JSON.';
    }
    e.target.value = '';
    refresh();
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Reset all progress? Earned trophies and counters will be cleared.')) {
      state.earned = {};
      state.progress = {};
      saveState(state);
      refresh();
    }
  });

  refresh();
}

boot();
