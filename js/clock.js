// clock.js: the only place the app reads the wall clock.
// Pure helpers take epoch ms (or "YYYY-MM-DD") and use device local time.
// Tests and demo mode replace the clock with setNow().

let fixedNow = null;

/** Epoch ms now. Uses the fixed time when one is set (tests, ?demo). */
export function now() {
  return fixedNow === null ? Date.now() : fixedNow;
}

/** Fix the clock to epoch ms, or pass null to use the real clock again. */
export function setNow(t) {
  fixedNow = t === null || t === undefined ? null : Number(t);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Device local day "YYYY-MM-DD" for epoch ms t. */
export function dayOf(t) {
  const d = new Date(t);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/** Today's local day key. */
export function today() {
  return dayOf(now());
}

/** Parse "YYYY-MM-DD" to a local Date at midnight. Throws on bad input. */
export function parseDay(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day));
  if (!m) throw new Error("bad day: " + day);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (dayOf(d.getTime()) !== day) throw new Error("bad day: " + day);
  return d;
}

/** Add n calendar days to a day key (DST safe, works on dates not ms). */
export function addDays(day, n) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayOf(d.getTime());
}

/** Whole days from a to b (b minus a). */
export function daysBetween(a, b) {
  const da = parseDay(a), db = parseDay(b);
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** Weekday of a day key, JS numbering: 0 Sunday ... 6 Saturday. */
export function weekday(day) {
  return parseDay(day).getDay();
}

/** True when the day is a school day per config.schoolDays. Off days are handled by rules.js. */
export function isSchoolDay(day, config) {
  return config.schoolDays.includes(weekday(day));
}

/** Monday of the week holding day. */
export function weekStart(day) {
  const wd = weekday(day);
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

/** ISO week key "YYYY-Www" for the week holding day (used to seed the Friday Crate). */
export function weekKey(day) {
  const d = parseDay(day);
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const wd = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - wd);
  const y = u.getUTCFullYear();
  const w = Math.ceil(((u - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return y + "-W" + pad(w);
}

/** Parse "HH:MM" to minutes after midnight. */
export function hm(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error("bad time: " + text);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Local minutes after midnight for epoch ms t. */
export function minutesOfDay(t) {
  const d = new Date(t);
  return d.getHours() * 60 + d.getMinutes();
}

/** Epoch ms of "HH:MM" on a local day. */
export function at(day, time) {
  const d = parseDay(day);
  const mins = hm(time);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d.getTime();
}

/** True when t is strictly before "HH:MM" on t's own local day. */
export function isBefore(t, time) {
  return t < at(dayOf(t), time);
}

/** Whole seconds between two epoch ms values, never negative. */
export function secondsBetween(a, b) {
  return Math.max(0, Math.floor((b - a) / 1000));
}

/** "m:ss" for a timer display. */
export function mmss(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return Math.floor(s / 60) + ":" + pad(s % 60);
}
