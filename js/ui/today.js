// Card W1-D. Kid screen "today": Today's Run. Also exports the small helpers the other run screens share
// (h, rich, emit, nav, step helpers). No raw HTML sinks anywhere: text goes in as text nodes, and the only
// markup ever allowed is <b> (see rich), so task text cannot inject elements.
// ctx contract: { state, config, device, kid, day, go?, append?(ev), events?, step?, photoUi?, demo }.
//   append(ev) persists the event and updates ctx.state itself (W2 supplies it). Without it, emit() falls
//   back to store.append (real) or an in-memory log (demo, starts empty, so the fixture state is replaced
//   by the state derived from the demo session on the first tap).

import { now, today, weekday, isSchoolDay, parseDay, daysBetween } from "../clock.js";
import { reduce } from "../rules.js";
import * as store from "../store.js";
import { DAYS, TASKS, SUNDAY_BLOCKS } from "../../data/tasks.js";
import { buildBase, litRooms, upgrades } from "./base.js";

export const STEP_LABELS = { land: "Land", hw: "Homework", read: "Reading", zone: "Zone Mission", reset: "Room Reset" };
export const SUBJECT_LABELS = { math: "Math", "reading-log": "Reading log", spelling: "Spelling", science: "Science", other: "Other" };
export const LAND_ITEMS = [
  { id: "land-1", text: "Backpack on its hook" },
  { id: "land-2", text: "Lunchbox to the kitchen" },
  { id: "land-3", text: "Papers in Dad's tray" },
  { id: "land-4", text: "Eat your snack" },
];

// ---------- tiny DOM helpers ----------
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "disabled") el.disabled = true;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else el.append(k);
  }
}
export function clear(root) { root.textContent = ""; }

/** Allowlist renderer: only <b>...</b> becomes an element; every other character stays plain text. */
export function rich(parent, text) {
  let open = false;
  for (const part of String(text).split(/(<\/?b>)/i)) {
    if (!part) continue;
    if (/^<b>$/i.test(part)) { open = true; continue; }
    if (/^<\/b>$/i.test(part)) { open = false; continue; }
    if (open) { const b = document.createElement("b"); b.textContent = part; parent.append(b); }
    else parent.append(document.createTextNode(part));
  }
  return parent;
}

// ---------- state helpers ----------
export function dayKeyOf(ctx) { return ctx.day || today(); }
export function kidState(ctx) { return ctx.state.kids[ctx.kid]; }
export function dayState(ctx) { return kidState(ctx).days[dayKeyOf(ctx)] || null; }
export function eventsOf(ctx) {
  if (Array.isArray(ctx.events)) return ctx.events;
  return ctx.demo ? [] : store.load().events;
}

/** Make an event for this kid, persist it, and leave ctx.state current. */
export function emit(ctx, type, data) {
  const ev = { id: store.newId(), t: now(), day: dayKeyOf(ctx), kid: ctx.kid, role: "kid", type, data };
  if (typeof ctx.append === "function") {
    ctx.append(ev);
    return ev;
  }
  if (ctx.demo) {
    ctx.events = (Array.isArray(ctx.events) ? ctx.events : []).concat(ev);
  } else {
    store.append(ev);
    ctx.events = store.load().events;
  }
  ctx.state = reduce(ctx.events, ctx.config);
  return ev;
}

/** Go to another screen. Real app: ctx.go(screen, params). Demo and tests: mount the module in place. */
export async function nav(root, ctx, screen, params) {
  ctx.step = params && params.step ? params.step : undefined;
  if (params && params.kid) ctx.kid = params.kid;
  if (typeof ctx.go === "function" && !ctx.demo) return ctx.go(screen, params);
  try {
    const mod = await import("./" + screen + ".js");
    return await mod.mount(root, ctx);
  } catch (err) {
    clear(root);
    const msg = String((err && err.message) || err);
    root.append(h("section", { class: "card" },
      h("h1", null, STEP_LABELS[screen] || "Not ready yet"),
      h("p", { class: "muted" }, msg.startsWith("not implemented") ? "This part is not built yet." : "Something went wrong. Try again."),
      h("button", { type: "button", class: "btn-primary", onclick: () => nav(root, ctx, "today") }, "Back to my run")));
  }
}

/** Steps in the order this kid will do them. */
export function stepOrder(config, order) {
  const has = (s) => config.steps.includes(s);
  const hw = ["hw", "read"].filter(has), mission = ["zone", "reset"].filter(has);
  return [].concat(has("land") ? ["land"] : [], order === "mission-first" ? mission.concat(hw) : hw.concat(mission));
}

export function stepStatus(day, step) { return day ? day.steps[step] : "todo"; }

/** First step still todo or on a fix list, or null when the run is finished. */
export function currentStep(ctx) {
  const day = dayState(ctx);
  if (!day || !day.started) return null;
  for (const s of stepOrder(ctx.config, day.order)) {
    const st = stepStatus(day, s);
    if (st === "todo" || st === "fix") return s;
  }
  return null;
}

/** Dishwasher racks swap weekly; weeks start Sunday. Week of Sunday 2026-11-15: E top, M bottom. */
export function dishRack(dayKey, kid) {
  if (kid !== "e" && kid !== "m") return null;
  const sunday = daysBetween("2026-11-15", dayKey) - weekday(dayKey);
  const eTop = (((sunday / 7) % 2) + 2) % 2 === 0;
  return (kid === "e") === eTop ? "top rack" : "bottom rack";
}

export function dayInfo(dayKey) {
  const d = weekday(dayKey);
  return DAYS.find((x) => x.day === d) || null;
}

export function tasksFor(dayKey, kidId, step) {
  const d = weekday(dayKey);
  return TASKS.filter((t) => t.day === d && t.kid === kidId && t.step === step).sort((a, b) => a.order - b.order);
}

/** Safety and rule notes attached to any of these tasks. Always shown with the list. */
export function notesFor(dayKey, taskIds) {
  const info = dayInfo(dayKey);
  if (!info) return [];
  const ids = new Set(taskIds);
  return info.notes.filter((n) => n.tasks.some((t) => ids.has(t)));
}

export function hwInfo(ctx) {
  const list = eventsOf(ctx).filter((e) => e && e.type === "hw.set" && e.kid === ctx.kid && e.day === dayKeyOf(ctx));
  const last = list[list.length - 1];
  return last ? { subjects: last.data.subjects || [], none: !!last.data.none } : null;
}

// ---------- the screen ----------
function statusLine(ctx, step, status) {
  const cfg = ctx.config;
  if (step === "land") return status === "todo" ? "Must do" : "Done";
  if (status === "verified") return "Checked";
  if (status === "fix") return "Fix list: redo a few things";
  if (status === "self") {
    const waits = (cfg.checkSteps || []).includes(step) && cfg.payOn[ctx.kid] === "verified";
    return waits ? "Done. Waiting for Dad's check" : "Done";
  }
  return cfg.photoSteps.includes(step) ? "Photo needed" : "To do";
}

function sundayCard(dayKey) {
  const dom = parseDay(dayKey).getDate();
  const n = Math.min(SUNDAY_BLOCKS.length, Math.ceil(dom / 7));
  const block = SUNDAY_BLOCKS.find((b) => b.n === n);
  if (!block) return null;
  const ul = h("ul", { class: "sunday-list" });
  for (const item of block.items) ul.append(rich(h("li", null), item));
  return h("section", { class: "card sunday", "data-block": String(block.n) },
    h("h2", null, "Sunday block " + block.n + ": " + block.title), ul);
}

export function mount(root, ctx) {
  render(root, ctx);
}

/** My base, Shop, Tickets, History. Shown on run days and no run days alike (the shop stays open on weekends). */
function moreNav(root, ctx) {
  const nav2 = h("nav", { class: "run-nav", "aria-label": "More" });
  for (const [screen, label] of [["base", "My base"], ["shop", "Shop"], ["tickets", "Tickets"], ["history", "History"]]) {
    nav2.append(h("button", { type: "button", "data-go": screen, onclick: () => nav(root, ctx, screen) }, label));
  }
  return nav2;
}

function render(root, ctx) {
  const cfg = ctx.config;
  const dayKey = dayKeyOf(ctx);
  const kid = kidState(ctx);
  const day = dayState(ctx);
  clear(root);
  const wrap = h("div", { class: "run kid-" + ctx.kid, "data-kid": ctx.kid });

  const name = (ctx.device && ctx.device.names && ctx.device.names[ctx.kid]) || ctx.kid.toUpperCase();
  wrap.append(h("header", { class: "run-head" },
    h("div", { class: "run-who" }, h("span", { class: "kid-dot " + ctx.kid }), h("span", { class: "run-name" }, name)),
    h("h1", { class: "run-title" }, "Today's Run"),
    h("div", { class: "run-stats" },
      h("span", { class: "coin-chip balance", "data-balance": "" }, String(kid.balance) + " tokens"),
      h("span", { class: "chip streak" }, "Streak " + kid.streak))));

  const runDay = isSchoolDay(dayKey, cfg) && !(day && day.off);
  if (!runDay) {
    const sunday = weekday(dayKey) === 0 ? sundayCard(dayKey) : null;
    wrap.append(h("section", { class: "card no-run" },
      h("h2", null, day && day.off ? "Day off" : "No run today"),
      h("p", { class: "muted" }, "Your streak is safe. Enjoy the day.")));
    if (sunday) wrap.append(sunday);
    wrap.append(moreNav(root, ctx));
    root.append(wrap);
    return;
  }

  // ---- W1-F BASE ART SLOT: W1-F replaces the placeholder below with the illustrated base. ----
  const order = day && day.order;
  const steps = stepOrder(cfg, order);
  const lit = steps.filter((s) => ["self", "verified"].includes(stepStatus(day, s))).length;
  const slot = h("section", { class: "base-slot", "data-slot": "base", "data-lit": String(lit), "aria-label": lit + " of " + steps.length + " rooms lit" });
  let art = null;
  if (typeof document.createElementNS === "function") {
    try { art = buildBase(litRooms(day, cfg), upgrades(kidState(ctx).unlocks), { full: !!(day && day.full) }); } catch (e) { art = null; }
  }
  if (!art) {
    art = h("div", { class: "base-placeholder" });
    steps.forEach((s, i) => art.append(h("span", { class: "room" + (i < lit ? " on" : ""), "aria-hidden": "true" })));
  }
  slot.append(art);
  wrap.append(slot);
  // ---- end W1-F slot ----

  if (day && day.full) {
    wrap.append(h("section", { class: "card run-done", role: "status" },
      h("h2", null, "Run complete"),
      h("p", null, "Your base is fully lit. Free time is unlocked."),
      h("p", { class: "muted" }, "Earned today: " + day.earned + " tokens")));
  }

  if (!day || !day.started) {
    const go = (o) => { emit(ctx, "run.start", { order: o }); render(root, ctx); };
    wrap.append(h("section", { class: "card start-card" },
      h("h2", null, "How do you want to start?"),
      h("p", { class: "muted" }, "Land comes first either way. Then you pick."),
      h("div", { class: "btn-stack" },
        h("button", { type: "button", class: "btn-primary", "data-start": "hw-first", onclick: () => go("hw-first") }, "Homework first"),
        h("button", { type: "button", class: "btn-secondary", "data-start": "mission-first", onclick: () => go("mission-first") }, "Mission first"))));
  }

  const started = !!(day && day.started);
  const current = currentStep(ctx);
  const list = h("ol", { class: "steps" });
  steps.forEach((s, i) => {
    const st = stepStatus(day, s);
    const tok = cfg.tokens[s];
    const btn = h("button", {
      type: "button", class: "step" + (s === current ? " current" : ""), "data-step": s, "data-status": st,
      "aria-current": s === current ? "step" : false, disabled: !started,
      onclick: () => nav(root, ctx, "step", { step: s }),
    },
      h("span", { class: "dot", "aria-hidden": "true" }, st === "self" || st === "verified" ? "✓" : String(i + 1)),
      h("span", { class: "step-text" },
        h("span", { class: "step-name" }, STEP_LABELS[s]),
        h("span", { class: "step-status" }, statusLine(ctx, s, st))),
      tok > 0 ? h("span", { class: "coin-chip" }, "+" + tok) : h("span", { class: "chip must" }, "Must do"));
    list.append(h("li", null, btn));
  });
  wrap.append(list);

  const rack = dishRack(dayKey, ctx.kid);
  if (rack) wrap.append(h("p", { class: "muted dish" }, "Dishwasher this week: " + rack));

  wrap.append(moreNav(root, ctx));
  root.append(wrap);
}
