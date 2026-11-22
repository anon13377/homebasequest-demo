// Card W2. Screen router and app context.
// boot(root) decides: ?demo= (fixture screens, never on a paired device) or the first run wizard or the app.
// ctx (CONTRACTS v2 addendum item 9): { store, sync, state, events, config, device, kid, day, step, demo?,
//   append(ev), go(screen, params), refresh() }. Screens mount as mount(root, ctx).
// A kid role device never mounts a parent module: the router draws the refusal card itself.

import { CONFIG } from "../data/config.js";
import { reduce } from "./rules.js";
import * as store from "./store.js";
import * as sync from "./sync.js";

export const SCREENS = {
  who: "./ui/who.js", today: "./ui/today.js", step: "./ui/step.js", homework: "./ui/homework.js",
  base: "./ui/base.js", shop: "./ui/shop.js", tickets: "./ui/tickets.js", history: "./ui/history.js",
  setup: "./setup.js",
  "parent-board": "./parent/board.js", "parent-checks": "./parent/checks.js",
  "parent-requests": "./parent/requests.js", "parent-week": "./parent/week.js",
  "parent-editors": "./parent/editors.js", "parent-devices": "./parent/devices.js",
  "parent-settings": "./parent/settings.js", "parent-pin": "./parent/pin.js",
};
// Screens that are safe to redraw when a pull brings new events (no timers or half filled forms).
const REDRAW = new Set(["today", "tickets", "history", "parent-board", "parent-checks", "parent-requests", "parent-week"]);
const BAD_PART = new Set(["", "__proto__", "constructor", "prototype"]);

/** Default config with every parent config.set folded in, oldest first (same rule as the server). */
export function effectiveConfig(events, base) {
  const c = structuredClone(base || CONFIG);
  for (const e of events || []) {
    if (!e || e.type !== "config.set" || e.role !== "parent" || !e.data || typeof e.data.path !== "string") continue;
    const parts = e.data.path.split(".");
    if (parts.some((p) => BAD_PART.has(p))) continue;
    let o = c, ok = true;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o || typeof o[parts[i]] !== "object" || o[parts[i]] === null) { ok = false; break; }
      o = o[parts[i]];
    }
    if (ok) o[parts[parts.length - 1]] = structuredClone(e.data.value === undefined ? null : e.data.value);
  }
  return c;
}

/** True once the wizard has finished on this device. */
export function isSetUp(device) {
  return !!device && (device.mode === "local" || device.mode === "link");
}

/** The first screen for this device. */
export function homeFor(device) {
  if (!isSetUp(device)) return "setup";
  return device.mode === "link" && device.role === "parent" ? "parent-board" : "who";
}

/** Build the live ctx. opts: { root, store?, sync?, mountFn? } (tests inject fakes). */
export function makeCtx(opts) {
  const st = opts.store || store;
  const sy = opts.sync || sync;
  const ctx = { store: st, sync: sy, demo: false, current: null };
  let pushing = Promise.resolve();
  ctx.refresh = () => {
    const l = st.load();
    ctx.device = l.device;
    ctx.events = l.events;
    ctx.config = effectiveConfig(ctx.events);
    ctx.state = reduce(ctx.events, CONFIG); // the reducer folds config.set itself from the default
    if (!ctx.kid) {
      const ids = (ctx.device.kidIds || []).filter((k) => ctx.config.kids.includes(k));
      if (ids.length === 1) ctx.kid = ids[0];
    }
    return ctx;
  };
  ctx.append = (ev) => {
    const added = st.append(ev);
    ctx.refresh();
    if (added && sy.status() !== "local") pushing = pushing.then(() => sy.push()).catch(() => {});
    return added;
  };
  ctx.go = (screen, params) => go(opts.root, ctx, screen, params, opts.mountFn);
  ctx.refresh();
  return ctx;
}

function card(root, title, text) {
  root.textContent = "";
  const sec = document.createElement("section");
  sec.className = "card";
  const h = document.createElement("h1");
  h.textContent = title;
  const p = document.createElement("p");
  p.className = "muted";
  p.textContent = text;
  sec.append(h, p);
  root.append(sec);
  return sec;
}

/** Switch screen. Unknown screens go home. Parent screens on a kid device show the refusal, nothing else. */
export async function go(root, ctx, screen, params, mountFn) {
  if (params && params.kid) ctx.kid = params.kid;
  if (params && "step" in params) ctx.step = params.step;
  if (!SCREENS[screen]) screen = homeFor(ctx.device);
  if (screen.startsWith("parent-") && !(ctx.device && ctx.device.role === "parent")) {
    ctx.current = "refused";
    const sec = card(root, "Parents only", "This is a kid device. Parent tools are not available here.");
    sec.dataset.kidRefused = "";
    return;
  }
  ctx.current = screen;
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.mode = screen.startsWith("parent-") ? "parent" : "kid";
  }
  try {
    const mod = mountFn ? await mountFn(SCREENS[screen]) : await import(SCREENS[screen]);
    return await mod.mount(root, ctx, params);
  } catch (err) {
    card(root, "Something went wrong", "That screen could not open. Go back and try again.");
    if (typeof console !== "undefined") console.warn("screen failed:", screen); // never the error text: it may carry input
  }
}

/** Pull now, refresh, and redraw the current screen when new events came in and it is safe to redraw. */
export async function pullNow(root, ctx) {
  if (ctx.sync.status() === "local") return 0;
  let added = 0;
  try {
    await ctx.sync.push();
  } catch (e) { /* offline: the outbox waits */ }
  try { added = (await ctx.sync.pull()).added; } catch (e) { added = 0; }
  if (added > 0) {
    ctx.refresh();
    if (REDRAW.has(ctx.current)) await go(root, ctx, ctx.current);
  }
  return added;
}

function setSwitch(ctx) {
  const b = typeof document !== "undefined" && document.getElementById("mode-switch");
  if (!b) return;
  const parentDev = ctx.device && ctx.device.role === "parent" && isSetUp(ctx.device);
  b.hidden = !parentDev;
  b.textContent = String(ctx.current || "").startsWith("parent-") ? "Kids" : "Parent";
  b.onclick = () => {
    const inParent = String(ctx.current || "").startsWith("parent-");
    ctx.go(inParent ? "who" : "parent-board");
  };
}

/** Entry point from index.html. */
export async function boot(root) {
  const demo = new URLSearchParams(location.search).get("demo");
  const device = store.device();
  if (demo && !(device.mode === "link")) {
    // Demo never runs on a paired device: fixture ctx carries no backend URL and no secrets.
    const m = await import("./demo.js");
    return m.mountDemo(root, demo);
  }
  const ctx = makeCtx({ root });
  const realGo = ctx.go;
  ctx.go = async (screen, params) => { const r = await realGo(screen, params); setSwitch(ctx); return r; };
  await ctx.go(homeFor(ctx.device));
  if (ctx.device.mode === "link") {
    const every = Math.max(15, Number(ctx.config.backend && ctx.config.backend.pullEverySec) || 60) * 1000;
    pullNow(root, ctx);
    setInterval(() => pullNow(root, ctx), every);
    addEventListener("online", () => pullNow(root, ctx));
  }
  return ctx;
}

/** Back compat with the W0 stub names. */
export function start(root) { return boot(root); }
