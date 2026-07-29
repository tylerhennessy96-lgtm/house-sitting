/* ── House sitting ──────────────────────────────
   One page, one job: show whoever's looking after the house what
   needs doing today, and let them look ahead or back.
   Ticks are saved in this browser only (localStorage).
   ──────────────────────────────────────────────────────────── */

'use strict';

/* ── Config ─────────────────────────────────────────────────── */

const START = new Date(2026, 6, 31);  // Fri 31 July 2026
const END   = new Date(2026, 7, 31);  // Mon 31 August 2026

const INDOOR_PLANT_WEEKDAY = 0;       // 0 = Sunday

const STORE_KEY = 'southerton5.v1';

/* Notes that only apply to particular days. */
const DAY_NOTES = {
  '2026-07-31': "First day — thank you for doing this. Everything you need is in the house notes below, and my number is at the bottom if anything comes up.",
  '2026-08-30': 'Last full day — thank you for looking after the place.',
  '2026-08-31': "I'm back today. Feed the fish as usual and that's you done. Thank you, genuinely."
};

/* ── Date helpers ───────────────────────────────────────────── */

const DAY_MS = 86400000;

/** Local-date ISO key (never UTC — avoids the off-by-one timezone trap). */
function key(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function midnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const fmtWeekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const fmtFull    = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Every day of the stay, in order. */
const DAYS = (() => {
  const out = [];
  for (let d = START; d <= END; d = addDays(d, 1)) out.push(d);
  return out;
})();

const TODAY_KEY = key(new Date());
const todayIndex = DAYS.findIndex(d => key(d) === TODAY_KEY);

/* ── Task definitions ───────────────────────────────────────── */

function tasksFor(date) {
  const list = [
    {
      id: 'fish',
      title: 'Feed the fish',
      sub: 'A small pinch. Better to underfeed than overfeed.'
    },
    {
      id: 'outdoor',
      title: 'Water the outdoor plants',
      sub: 'Unless it has rained — morning or evening is kindest.',
      skippable: true
    }
  ];

  if (date.getDay() === INDOOR_PLANT_WEEKDAY) {
    list.push({
      id: 'indoor',
      title: 'Water the indoor plants',
      sub: 'Once a week. A day either way is fine.',
      weekly: true
    });
  }

  list.push({
    id: 'doors',
    title: 'Front and back doors locked',
    sub: 'Including the bottom lock on the front door, from the outside.'
  });

  return list;
}

/* ── Storage ────────────────────────────────────────────────── */

let store = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};  // private browsing, corrupt data — just start fresh
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* Storage unavailable. Ticks won't persist, but the page still works. */
  }
}

const EMPTY_DAY = Object.freeze({ done: [], rain: false });

/** Read-only view of a day — does not write, so untouched days stay unstored. */
function dayState(k) {
  const s = store[k];
  if (!s) return EMPTY_DAY;
  if (!Array.isArray(s.done)) s.done = [];
  return s;
}

/** Same, but creates the entry — use only when about to change something. */
function editDay(k) {
  if (!store[k] || !Array.isArray(store[k].done)) {
    store[k] = { done: [], rain: false, ...store[k] };
    if (!Array.isArray(store[k].done)) store[k].done = [];
  }
  return store[k];
}

/** Is this task satisfied? Rain counts as satisfying the outdoor watering. */
function isSatisfied(k, task) {
  const s = dayState(k);
  if (task.skippable && s.rain) return true;
  return s.done.includes(task.id);
}

/** 'none' | 'part' | 'done' — used for the calendar dots. */
function dayStatus(date) {
  const k = key(date);
  const tasks = tasksFor(date);
  const n = tasks.filter(t => isSatisfied(k, t)).length;
  if (n === 0) return 'none';
  return n === tasks.length ? 'done' : 'part';
}

/* ── Elements ───────────────────────────────────────────────── */

const el = {
  weekday:  document.getElementById('day-weekday'),
  date:     document.getElementById('day-date'),
  badges:   document.getElementById('day-badges'),
  note:     document.getElementById('day-note'),
  tasks:    document.getElementById('task-list'),
  rain:     document.getElementById('rain-check'),
  progress: document.getElementById('progress'),
  prev:     document.getElementById('prev-day'),
  next:     document.getElementById('next-day'),
  todayBtn: document.getElementById('today-btn'),
  grid:     document.getElementById('cal-grid'),
  card:     document.getElementById('day-card'),
  reset:    document.getElementById('reset-btn')
};

/* Start on today if we're mid-stay, otherwise on the first day. */
let index = todayIndex >= 0 ? todayIndex : 0;

/* ── Rendering ──────────────────────────────────────────────── */

function renderDay() {
  const date = DAYS[index];
  const k = key(date);
  const state = dayState(k);

  el.weekday.textContent = fmtWeekday.format(date);
  el.date.textContent = fmtFull.format(date);

  /* Badges */
  el.badges.innerHTML = '';
  const today = midnight(new Date());
  if (k === TODAY_KEY) {
    el.badges.append(badge('Today', 'badge-today'));
  } else if (date < today) {
    el.badges.append(badge('Past'));
  } else {
    const away = Math.round((date - today) / DAY_MS);
    el.badges.append(badge(away === 1 ? 'Tomorrow' : `In ${away} days`));
  }
  if (date.getDay() === INDOOR_PLANT_WEEKDAY) {
    el.badges.append(badge('Indoor plant day', 'badge-note'));
  }

  /* Day-specific note */
  if (DAY_NOTES[k]) {
    el.note.textContent = DAY_NOTES[k];
    el.note.hidden = false;
  } else {
    el.note.hidden = true;
  }

  /* Tasks */
  const tasks = tasksFor(date);
  el.tasks.innerHTML = '';
  tasks.forEach(task => el.tasks.append(taskRow(k, task)));

  /* Rain toggle */
  el.rain.checked = state.rain;

  renderProgress();

  /* Nav state */
  el.prev.disabled = index === 0;
  el.next.disabled = index === DAYS.length - 1;
  el.todayBtn.hidden = todayIndex < 0 || index === todayIndex;

  renderCalendar();
}

function renderProgress() {
  const date = DAYS[index];
  const k = key(date);
  const tasks = tasksFor(date);
  const done = tasks.filter(t => isSatisfied(k, t)).length;

  el.progress.textContent = done === tasks.length
    ? `All done for ${fmtWeekday.format(date)} ✓`
    : `${done} of ${tasks.length} done`;
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = 'badge' + (cls ? ' ' + cls : '');
  span.textContent = text;
  return span;
}

function taskRow(k, task) {
  const state = dayState(k);
  const rained = task.skippable && state.rain;
  const checked = isSatisfied(k, task);

  const li = document.createElement('li');
  li.className = 'task'
    + (checked ? ' is-done' : '')
    + (task.weekly ? ' is-weekly' : '')
    + (rained ? ' is-skipped' : '');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.disabled = rained;
  input.id = `t-${k}-${task.id}`;

  const text = document.createElement('label');
  text.className = 'task-text';
  text.htmlFor = input.id;

  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;

  const sub = document.createElement('span');
  sub.className = 'task-sub';
  sub.textContent = rained ? 'Skipped — it rained today.' : task.sub;

  text.append(title, sub);
  li.append(input, text);

  /* Update in place rather than re-rendering the list — a full rebuild would
     destroy the checkbox that was just used, throwing away keyboard focus. */
  input.addEventListener('change', () => {
    const done = editDay(k).done;
    const at = done.indexOf(task.id);
    if (input.checked) {
      if (at === -1) done.push(task.id);
    } else if (at > -1) {
      done.splice(at, 1);
    }
    save();
    li.classList.toggle('is-done', input.checked);
    renderProgress();
    renderCalendar();
  });

  return li;
}

function renderCalendar() {
  el.grid.innerHTML = '';

  /* Pad so the grid starts on a Monday. */
  const lead = (DAYS[0].getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell is-empty';
    el.grid.append(blank);
  }

  DAYS.forEach((date, i) => {
    const k = key(date);
    const status = dayStatus(date);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-cell'
      + (i === index ? ' is-selected' : '')
      + (k === TODAY_KEY ? ' is-today' : '');
    cell.setAttribute('role', 'listitem');
    cell.setAttribute('aria-label',
      `${fmtWeekday.format(date)} ${fmtFull.format(date)} — ${
        status === 'done' ? 'all done' : status === 'part' ? 'part done' : 'not started'}`);

    const num = document.createElement('span');
    num.className = 'cal-num';
    num.textContent = date.getDate();

    const dot = document.createElement('i');
    dot.className = `dot dot-${status}`;

    cell.append(num, dot);
    cell.addEventListener('click', () => go(i));
    el.grid.append(cell);
  });
}

/* ── Navigation ─────────────────────────────────────────────── */

function go(i) {
  index = Math.max(0, Math.min(DAYS.length - 1, i));
  renderDay();
}

el.prev.addEventListener('click', () => go(index - 1));
el.next.addEventListener('click', () => go(index + 1));
el.todayBtn.addEventListener('click', () => go(todayIndex));

el.rain.addEventListener('change', () => {
  editDay(key(DAYS[index])).rain = el.rain.checked;
  save();
  renderDay();
});

el.reset.addEventListener('click', () => {
  if (!confirm('Clear every tick for the whole stay?')) return;
  store = {};
  save();
  renderDay();
});

/* Arrow keys, as long as we're not typing in something. */
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowLeft')  { go(index - 1); e.preventDefault(); }
  if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
});

/* Swipe between days on touch devices. */
let touchX = 0, touchY = 0;

el.card.addEventListener('touchstart', e => {
  touchX = e.changedTouches[0].clientX;
  touchY = e.changedTouches[0].clientY;
}, { passive: true });

el.card.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    go(index + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

/* ── Go ─────────────────────────────────────────────────────── */

renderDay();
