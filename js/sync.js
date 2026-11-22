// Card W1-A. Outbox push and pull against the configured backend only (device.backendUrl).
// Secrets never go into a thrown message or a log line; errors here are generic.
import * as store from "./store.js";

let net = "ok"; // last network result: "ok" | "offline"
let fetchImpl = null;
/** test hook: inject a fetch implementation */
export function configure(opts) { if (opts && "fetch" in opts) fetchImpl = opts.fetch; net = "ok"; }
const doFetch = (u, i) => (fetchImpl || globalThis.fetch.bind(globalThis))(u, i);

function target() {
  const d = store.device();
  if (!d.backendUrl || !d.familyKey) return null;
  return { url: d.backendUrl, fk: d.familyKey, key: d.parentSecret || d.kidKey || null };
}

async function post(t, body) {
  let r;
  try {
    r = await doFetch(t.url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) });
  } catch (e) { net = "offline"; throw new Error("offline"); }
  if (!r.ok) { net = "offline"; throw new Error("backend status " + r.status); }
  net = "ok";
  return r.json();
}

async function toBase64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}

/** -> { sent, refused: [ { id, why } ] }  Drains the outbox in order; stops at the first network failure. */
export async function push() {
  const t = target();
  if (!t) return { sent: 0, refused: [] };
  const { events, outbox } = store.load();
  const byId = new Map(events.map((e) => [e.id, e]));
  let sent = 0;
  const refused = [];
  let i = 0;
  while (i < outbox.length) {
    const o = outbox[i];
    try {
      if (o.kind === "photo") {
        const blob = await store.getPhoto(o.id);
        if (!blob) { store.settle([o], []); i++; continue; } // photo gone, nothing to send
        const rep = await post(t, { op: "photo", fk: t.fk, key: t.key, id: o.id, jpegBase64: await toBase64(blob) });
        if (rep && rep.ok === false && rep.why === "too big") { store.settle([o], []); refused.push({ id: o.id, why: rep.why }); }
        else if (!rep || rep.ok === false) throw new Error("refused");
        else { store.settle([o], []); sent++; }
        i++;
      } else {
        const group = [];
        while (i < outbox.length && outbox[i].kind === "event") { group.push(outbox[i]); i++; }
        const evs = group.map((g) => byId.get(g.id)).filter(Boolean);
        const rep = await post(t, { op: "push", fk: t.fk, key: t.key, events: evs });
        if (!rep || rep.ok === false) throw new Error("refused");
        const ref = (rep.refused || []).map((r) => ({ id: r.id, why: r.why }));
        refused.push(...ref);
        store.settle(group, ref.map((r) => r.id));
        sent += group.length - ref.length;
      }
    } catch (e) {
      if (net === "offline") break;
      throw new Error("push failed");
    }
  }
  return { sent, refused };
}

/** -> { added }  Pulls pages until the server reply no longer says more:true (capped so a bad server cannot loop). */
export async function pull() {
  const t = target();
  if (!t) return { added: 0 };
  let added = 0;
  for (let page = 0; page < 50; page++) {
    let r;
    try {
      const q = "?op=pull&fk=" + encodeURIComponent(t.fk) + "&since=" + store.since();
      r = await doFetch(t.url + q, { method: "GET" });
    } catch (e) { net = "offline"; return { added }; }
    if (!r.ok) { net = "offline"; return { added }; }
    net = "ok";
    const rep = await r.json();
    if (!rep || rep.ok === false) return { added };
    const before = store.since();
    added += store.mergeEvents(rep.events || []);
    if (!rep.more || store.since() <= before) break;
  }
  return { added };
}

/** -> "local" | "ok" | "offline" */
export function status() {
  return target() ? net : "local";
}
