// DEMO only. Seeds a local only parent device with kids E and M and a week of practice history.
// Every history item is a normal app event folded by the app's own reducer (rules.js). Dates are relative to today.
// Storage: only keys that start with "hbqdemo:" and the IndexedDB "hbqdemo-photos". No service worker, no caches, no backend.

import { CONFIG } from "../data/config.js";
import { reduce } from "./rules.js";
import { addDays, at, today } from "./clock.js";
import * as store from "./store.js";

export const PREFIX = "hbqdemo:";
export const DB = "hbqdemo-photos";
export const DEMO_PIN = "1234";

async function digest(salt, pin) {
  const data = new TextEncoder().encode("hbq|" + salt + "|" + pin); // same recipe as js/parent/pin.js
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function photoBlob(text, color) {
  return new Promise((res) => {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 360;
    const g = c.getContext("2d");
    g.fillStyle = color; g.fillRect(0, 0, 480, 360);
    g.fillStyle = "rgba(255,255,255,0.85)"; g.fillRect(30, 120, 420, 120);
    g.fillStyle = "#222"; g.font = "bold 28px sans-serif"; g.textAlign = "center";
    g.fillText("DEMO PHOTO", 240, 168);
    g.font = "22px sans-serif"; g.fillText(text, 240, 208);
    c.toBlob((b) => res(b), "image/jpeg", 0.7);
  });
}

/** Build the seed events. Pure apart from ids and the clock. -> { events, photos: [[id, label]] } */
export function buildEvents(T) {
  const events = [], photos = [];
  let n = 0;
  const ev = (day, time, kid, role, type, data) => {
    events.push({ id: store.newId(), t: at(day, time) + (n++ % 50) * 1000, day, kid, role, type, data });
  };
  const ph = (kid, day, step) => { const id = store.newId(); photos.push([id, kid.toUpperCase() + " " + step + " " + day]); return id; };
  const done = (day, time, kid, step, photo) =>
    ev(day, time, kid, "kid", "step.done", { step, items: [], seconds: 600, photo: photo ? ph(kid, day, step) : null });
  const pass = (day, time, kid, step) => ev(day, time, kid, "parent", "check.pass", { step, day });

  for (let i = 9; i >= 1; i--) {
    const d = addDays(T, -i);
    // E: homework first, pays on self. Parent still looks at the photos later in the evening.
    ev(d, "15:30", "e", "kid", "run.start", { order: "hw-first" });
    done(d, "15:32", "e", "land", false);
    if (i === 4) { ev(d, "15:40", "e", "kid", "hw.set", { subjects: [], none: true }); done(d, "15:41", "e", "hw", false); }
    else { ev(d, "15:40", "e", "kid", "hw.set", { subjects: ["math", "spelling"], none: false }); done(d, "15:55", "e", "hw", true); }
    done(d, "16:20", "e", "read", false);
    done(d, "16:45", "e", "zone", true);
    done(d, "17:05", "e", "reset", true);
    if (i !== 1) { pass(d, "19:00", "e", "hw"); pass(d, "19:01", "e", "zone"); pass(d, "19:02", "e", "reset"); }
    // M: mission first, missions pay when a parent passes them.
    ev(d, "15:35", "m", "kid", "run.start", { order: "mission-first" });
    done(d, "15:37", "m", "land", false);
    done(d, "15:55", "m", "zone", true);
    done(d, "16:15", "m", "reset", true);
    ev(d, "16:30", "m", "kid", "hw.set", { subjects: ["reading-log"], none: false });
    done(d, "16:45", "m", "hw", true);
    if (i !== 6) done(d, "17:10", "m", "read", false); // day 6 back: reading skipped, so the run is not full
    pass(d, "19:05", "m", "hw"); pass(d, "19:06", "m", "zone");
    if (i === 3) {
      ev(d, "19:07", "m", "parent", "check.fix", { step: "reset", day: d, items: ["reset"] });
      done(d, "19:20", "m", "reset", true);
      pass(d, "19:40", "m", "reset");
    } else pass(d, "19:07", "m", "reset");
  }
  // Parent extras across the week.
  ev(addDays(T, -5), "18:00", "e", "parent", "adjust", { tokens: 5, reason: "Helped carry the groceries" });
  ev(addDays(T, -2), "19:30", null, "parent", "bonus.team", { key: "kitchen-closed" });
  // Shop history: one denied, one approved and delivered, one held today.
  const t1 = store.newId(), t2 = store.newId(), t3 = store.newId();
  ev(addDays(T, -5), "18:30", "e", "kid", "buy.request", { ticket: t1, item: "dinner", price: 60, team: false });
  ev(addDays(T, -5), "18:50", "e", "parent", "buy.deny", { ticket: t1, reason: "Dinner is already planned this week" });
  ev(addDays(T, -3), "18:30", "m", "kid", "buy.request", { ticket: t2, item: "screen30", price: 40, team: false });
  ev(addDays(T, -3), "18:45", "m", "parent", "buy.approve", { ticket: t2 });
  ev(addDays(T, -3), "20:00", "m", "parent", "buy.delivered", { ticket: t2 });
  ev(T, "14:00", "e", "kid", "buy.request", { ticket: t3, item: "snack", price: 30, team: false });
  // Today: M is mid run with a Zone Mission waiting for a parent check. E has not started yet.
  ev(T, "15:20", "m", "kid", "run.start", { order: "mission-first" });
  done(T, "15:22", "m", "land", false);
  done(T, "15:40", "m", "zone", true);
  return { events, photos };
}

/** Seed when this browser has no demo device yet. -> summary or null */
export async function ensureSeed() {
  if (localStorage.getItem(PREFIX + "device")) return null;
  return seed();
}

export async function seed() {
  const T = today();
  const { events, photos } = buildEvents(T);
  const salt = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const device = { mode: "local", role: "parent", kidIds: [], names: { e: "E", m: "M" }, pin: { salt, hash: await digest(salt, DEMO_PIN) } };
  const colors = ["#7aa6d8", "#8fc79a", "#e2b36b", "#c99ad6"];
  let i = 0;
  for (const [id, label] of photos) await store.putPhoto(id, await photoBlob(label, colors[i++ % colors.length]));
  localStorage.setItem(PREFIX + "events", JSON.stringify(events));
  localStorage.setItem(PREFIX + "outbox", "[]");
  store.saveDevice(device); // writes hbqdemo:device last, so a half seed reseeds next load
  const s = reduce(events, CONFIG);
  const sum = { events: events.length, photos: photos.length, held: Object.values(s.tickets).filter((t) => t.status === "held").length };
  for (const k of ["e", "m"]) sum[k] = { balance: s.kids[k].balance, held: s.kids[k].held, lifetime: s.kids[k].lifetime, streak: s.kids[k].streak, streakPrev: s.kids[k].streakPrev, unlocks: s.kids[k].unlocks.length };
  return sum;
}

/** Clear only demo storage, then reload (the next load reseeds). */
export async function resetDemo() {
  const drop = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) drop.push(k); }
  drop.forEach((k) => localStorage.removeItem(k));
  await new Promise((res) => {
    try {
      const r = indexedDB.deleteDatabase(DB);
      r.onsuccess = r.onerror = r.onblocked = () => res();
    } catch (e) { res(); }
  });
  location.reload();
}
