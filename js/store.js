// Card W1-A. Local first event store, outbox, device record and photo store. Keys start with hbqdemo: (demo copy).
// Storage is read lazily from globalThis so node tests can inject fakes (see tests/store.test.mjs).
// A failed write leaves the previous value intact: every multi key write rolls back on error.

const K = { events: "hbqdemo:events", outbox: "hbqdemo:outbox", device: "hbqdemo:device", since: "hbqdemo:since" };
const DB_NAME = "hbqdemo-photos";
const mem = new Map(); // photo fallback when IndexedDB is missing or fails

function ls() {
  try { return globalThis.localStorage || null; } catch (e) { return null; }
}
const memLs = new Map();
function rawGet(k) {
  const s = ls();
  return s ? s.getItem(k) : (memLs.has(k) ? memLs.get(k) : null);
}
function rawSet(k, v) {
  const s = ls();
  if (!s) { memLs.set(k, v); return; }
  try { s.setItem(k, v); } catch (e) { throw new Error("storage full or blocked: " + k); }
}
function rawDel(k) {
  const s = ls();
  if (s) s.removeItem(k); else memLs.delete(k);
}
function readJson(k, dflt) {
  const v = rawGet(k);
  if (v == null) return dflt;
  try { return JSON.parse(v); } catch (e) { return dflt; }
}
function writeJson(k, val) { rawSet(k, JSON.stringify(val)); }

// Write several keys; if any write fails, restore the earlier values and rethrow.
function writeAll(pairs) {
  const old = pairs.map(([k]) => rawGet(k));
  try {
    for (const [k, v] of pairs) writeJson(k, v);
  } catch (e) {
    pairs.forEach(([k], i) => {
      try { if (old[i] == null) rawDel(k); else rawSet(k, old[i]); } catch (_) { /* best effort */ }
    });
    throw e;
  }
}

export function newId() {
  const a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(22);
  globalThis.crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += a[b % a.length];
  return s;
}

/** -> { events, outbox, device } */
export function load() {
  return { events: readJson(K.events, []), outbox: readJson(K.outbox, []), device: device() };
}

/** append one immutable event and queue it (and its photo, first) in the outbox */
export function append(event) {
  if (!event || typeof event.id !== "string" || !event.id || typeof event.type !== "string") throw new Error("bad event");
  const events = readJson(K.events, []);
  if (events.some((e) => e.id === event.id)) return false; // idempotent
  const outbox = readJson(K.outbox, []);
  const pid = event.data && event.data.photo;
  if (pid && !outbox.some((o) => o.kind === "photo" && o.id === pid)) outbox.push({ kind: "photo", id: pid });
  outbox.push({ kind: "event", id: event.id });
  events.push(event);
  writeAll([[K.events, events], [K.outbox, outbox]]);
  return true;
}

/** replace the local log with the server log; events still waiting in the outbox stay at the end */
export function replaceFromServer(events) {
  const have = new Set(events.map((e) => e.id));
  const old = readJson(K.events, []);
  const outbox = readJson(K.outbox, []).filter((o) => o.kind !== "event" || !have.has(o.id));
  const pending = new Set(outbox.filter((o) => o.kind === "event").map((o) => o.id));
  const local = old.filter((e) => pending.has(e.id) && !have.has(e.id));
  let since = readJson(K.since, 0);
  for (const e of events) if (typeof e.seq === "number" && e.seq > since) since = e.seq;
  writeAll([[K.events, events.concat(local)], [K.outbox, outbox], [K.since, since]]);
}

/** merge server events (pull): server copy wins by id, new ones are added; returns count added */
export function mergeEvents(serverEvents) {
  const events = readJson(K.events, []);
  const idx = new Map(events.map((e, i) => [e.id, i]));
  let added = 0, since = readJson(K.since, 0);
  for (const e of serverEvents) {
    if (idx.has(e.id)) events[idx.get(e.id)] = e; else { events.push(e); added++; }
    if (typeof e.seq === "number" && e.seq > since) since = e.seq;
  }
  const have = new Set(serverEvents.map((e) => e.id));
  const outbox = readJson(K.outbox, []).filter((o) => o.kind !== "event" || !have.has(o.id));
  writeAll([[K.events, events], [K.outbox, outbox], [K.since, since]]);
  return added;
}

/** drop acknowledged outbox entries; refused event ids are also removed from the local log */
export function settle(done, refusedIds) {
  const gone = new Set(done.map((d) => d.kind + ":" + d.id));
  const bad = new Set(refusedIds || []);
  const outbox = readJson(K.outbox, []).filter((o) => !gone.has(o.kind + ":" + o.id));
  const events = readJson(K.events, []).filter((e) => !bad.has(e.id));
  writeAll([[K.outbox, outbox], [K.events, events]]);
}

export function since() { return readJson(K.since, 0); }

/** -> { role, kidIds, familyKey?, kidKey?, parentSecret?, backendUrl?, names: { e, m } } */
export function device() {
  return readJson(K.device, { role: "kid", kidIds: [], names: { e: "E", m: "M" } });
}
export function saveDevice(d) { writeJson(K.device, d); }

// ---- Photos: IndexedDB, with a memory fallback when IndexedDB is missing or fails ----
function idb() {
  const f = globalThis.indexedDB;
  if (!f) return Promise.reject(new Error("no indexeddb"));
  return new Promise((res, rej) => {
    const r = f.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("p");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(new Error("idb open failed"));
  });
}
function tx(mode, fn) {
  return idb().then((db) => new Promise((res, rej) => {
    const t = db.transaction("p", mode);
    const out = fn(t.objectStore("p"));
    t.oncomplete = () => { db.close(); res(out && out.result); };
    t.onerror = t.onabort = () => { db.close(); rej(new Error("idb tx failed")); };
  }));
}

/** save a photo in IndexedDB (memory fallback) */
export async function putPhoto(id, blob) {
  try { await tx("readwrite", (s) => s.put(blob, id)); mem.delete(id); } catch (e) { mem.set(id, blob); }
}

/** -> Blob or null */
export async function getPhoto(id) {
  try {
    const v = await tx("readonly", (s) => s.get(id));
    if (v) return v;
  } catch (e) { /* fall through */ }
  return mem.get(id) || null;
}

export async function deletePhoto(id) {
  mem.delete(id);
  try { await tx("readwrite", (s) => s.delete(id)); } catch (e) { /* ignore */ }
}
