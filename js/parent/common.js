// Card W1-H. Shared plumbing for the Parent screens: gate (kid refusal and PIN lock), nav shell, event sender,
// photo loader. Text goes in as text nodes only (no raw HTML sinks). The PIN is only a screen lock; the server is
// the real gate, so send() never decides by role: it sends and shows the server's answer.
// ctx: { state, config, device, day, go?, append?(ev), events?, demo, sync?, fetch?, blobUrl?(blob) }

import { h, clear, dayKeyOf, STEP_LABELS } from "../ui/today.js";
import { reduce } from "../rules.js";
import { now } from "../clock.js";
import * as store from "../store.js";

export { h, clear, dayKeyOf, STEP_LABELS };

export const VIEWS = [
  ["parent-board", "Today"], ["parent-checks", "Checks"], ["parent-requests", "Requests"], ["parent-week", "Week"],
  ["parent-editors", "Editors"], ["parent-devices", "Devices"], ["parent-settings", "Settings"],
];
export const STATUS_LABELS = { todo: "To do", self: "Needs check", verified: "Checked", fix: "Fix list" };
export const kidLabel = (ctx, k) => (ctx.device && ctx.device.names && ctx.device.names[k]) || k.toUpperCase();
export const isParentDevice = (ctx) => !!ctx.device && ctx.device.role === "parent";
export const kidIds = (ctx) => Object.keys(ctx.state.kids);

export function eventsOf(ctx) {
  if (Array.isArray(ctx.events)) return ctx.events;
  return ctx.demo ? [] : store.load().events;
}

/** Latest photo id the kid attached to this step on this day, from the event log (state does not carry it). */
export function photoIdFor(ctx, kid, day, step) {
  const list = eventsOf(ctx);
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e && e.type === "step.done" && e.kid === kid && e.data && e.data.step === step && e.day === day && e.data.photo) return e.data.photo;
  }
  return null;
}

/** Steps waiting for a check: self status on a photo or check step. -> [ { kid, day, step, photo } ] oldest first */
export function checkQueue(ctx) {
  const cfg = ctx.config, out = [];
  const steps = new Set([...(cfg.checkSteps || []), ...(cfg.photoSteps || [])]);
  for (const kid of kidIds(ctx)) {
    const days = ctx.state.kids[kid].days || {};
    for (const day of Object.keys(days).sort()) {
      for (const step of cfg.steps) {
        if (steps.has(step) && days[day].steps[step] === "self") out.push({ kid, day, step, photo: photoIdFor(ctx, kid, day, step) });
      }
    }
  }
  return out;
}
export const heldTickets = (ctx) => Object.values(ctx.state.tickets || {}).filter((t) => t.status === "held");

// ---------- sending ----------
/** Make a parent event, persist it, refresh ctx.state, push, and return { ok, why? }. */
export async function send(ctx, kid, type, data) {
  const ev = { id: store.newId(), t: now(), day: dayKeyOf(ctx), kid: kid || null, role: "parent", type, data };
  if (typeof ctx.append === "function") ctx.append(ev);
  else if (ctx.demo) { ctx.events = (Array.isArray(ctx.events) ? ctx.events : []).concat(ev); ctx.state = reduce(ctx.events, ctx.config); }
  else { store.append(ev); ctx.events = store.load().events; ctx.state = reduce(ctx.events, ctx.config); }
  if (ctx.demo && !ctx.sync) return { ok: true };
  try {
    const sync = ctx.sync || (await import("../sync.js"));
    const r = await sync.push();
    const bad = ((r && r.refused) || []).find((x) => x.id === ev.id);
    if (bad) return { ok: false, why: "refused", detail: bad.why };
    if (typeof sync.status === "function" && sync.status() === "offline") return { ok: true, offline: true };
    return { ok: true };
  } catch (e) {
    return { ok: true, offline: true }; // saved locally, goes out when the network is back
  }
}
export function refusalText(r) {
  if (r.why === "refused") return "The server did not accept that. This device is not allowed to do it.";
  return "That did not work. Try again.";
}

// ---------- navigation and shell ----------
export async function goto(root, ctx, view) {
  if (typeof ctx.go === "function" && !ctx.demo) return ctx.go(view);
  const mod = await import("./" + view.replace("parent-", "") + ".js");
  return mod.mount(root, ctx);
}

export function revokeUrls(ctx) {
  for (const u of ctx._urls || []) { try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ } }
  ctx._urls = [];
}

/** Returns true when the parent view may render. Otherwise draws the refusal or the PIN screen into root. */
export async function gate(root, ctx) {
  revokeUrls(ctx);
  if (!isParentDevice(ctx)) {
    clear(root);
    root.append(h("section", { class: "parent-shell card", "data-kid-refused": "" },
      h("h1", null, "Parents only"),
      h("p", { class: "muted" }, "This is a kid device. Parent tools are not available here.")));
    return false;
  }
  const pin = await import("./pin.js");
  if (ctx.demo || pin.isUnlocked()) return true;
  await pin.mount(root, ctx);
  return false;
}

/** Draw the nav bar and give back the body element (body.say(text) writes the status line). */
export function shell(root, ctx, view, title) {
  clear(root);
  const q = checkQueue(ctx).length, r = heldTickets(ctx).length;
  const nav = h("nav", { class: "pnav", "aria-label": "Parent sections" });
  for (const [v, label] of VIEWS) {
    const badge = v === "parent-checks" ? q : v === "parent-requests" ? r : 0;
    nav.append(h("button", {
      type: "button", class: "pnav-btn" + (v === view ? " active" : ""), "data-nav": v.replace("parent-", ""),
      "aria-current": v === view ? "page" : null, onclick: () => goto(root, ctx, v),
    }, label, badge ? h("span", { class: "pbadge", "data-badge": "" }, String(badge)) : null));
  }
  const body = h("div", { class: "pbody" });
  const msg = h("p", { class: "pmsg", role: "status", "data-msg": "" });
  root.append(h("div", { class: "parent-shell", "data-view": view.replace("parent-", "") },
    h("header", { class: "phead" }, h("h1", null, title),
      h("button", { type: "button", class: "btn-secondary", "data-lock": "", onclick: async () => { (await import("./pin.js")).lock(); goto(root, ctx, view); } }, "Lock")),
    nav, msg, body));
  body.say = (t) => { msg.textContent = t || ""; };
  return body;
}

/** Send one event, show the answer in the status line, and redraw on success. */
export async function act(body, ctx, rerender, kid, type, data, okText) {
  const r = await send(ctx, kid, type, data);
  if (!r.ok) { body.say(refusalText(r)); return r; }
  const nb = rerender();
  if (okText) (nb || body).say(okText);
  return r;
}

// ---------- photos (only ever called from a button inside a rendered, unlocked view) ----------
function b64ToBlob(b64) {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}
/** -> object URL string or null. Server read is POST photoGet with the parent secret in the body, never in a URL. */
export async function loadPhoto(ctx, id) {
  if (!id) return null;
  const d = ctx.device || {};
  let blob = null;
  if (d.backendUrl && d.familyKey && d.parentSecret) {
    try {
      const f = ctx.fetch || globalThis.fetch.bind(globalThis);
      const res = await f(d.backendUrl, { method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ op: "photoGet", fk: d.familyKey, key: d.parentSecret, id }) });
      const j = await res.json();
      if (j && j.ok && j.jpegBase64) blob = b64ToBlob(j.jpegBase64);
    } catch (e) { /* fall back to the local copy */ }
  }
  if (!blob) { try { blob = await store.getPhoto(id); } catch (e) { blob = null; } }
  if (!blob) return null;
  const url = ctx.blobUrl ? ctx.blobUrl(blob) : URL.createObjectURL(blob);
  (ctx._urls = ctx._urls || []).push(url);
  return url;
}

/** A "Show photo" button that fills a box with the picture. */
export function photoBox(ctx, id) {
  const box = h("div", { class: "photo-box", "data-photo-box": "" });
  if (!id) { box.append(h("p", { class: "muted", "data-nophoto": "" }, "No photo yet.")); return box; }
  const btn = h("button", { type: "button", class: "btn-secondary", "data-show-photo": id, onclick: async () => {
    btn.disabled = true;
    const url = await loadPhoto(ctx, id);
    clear(box);
    if (url) box.append(h("img", { class: "photo-img", src: url, alt: "Photo from the kid", "data-photo": id }));
    else box.append(h("p", { class: "muted", "data-photo-missing": "" }, "The photo is not available (it may be older than 14 days)."));
  } }, "Show photo");
  box.append(btn);
  return box;
}
