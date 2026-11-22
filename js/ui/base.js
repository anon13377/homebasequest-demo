// Card W1-F. Kid screen "base": the illustrated cutaway base, its earned upgrades, and the Friday Crate.
// Art is built as inline SVG nodes (createElementNS, never raw HTML) so colors follow the theme tokens.
// The crate result always comes from rules.crateRoll; opening sends the existing crate.open event.
// ctx contract: same as today.js ({ state, config, device, kid, day, go?, append?(ev), events?, demo }).

import { h, clear, emit, nav, kidState, dayKeyOf, stepOrder, stepStatus } from "./today.js";
import { crateRoll } from "../rules.js";
import { weekKey, weekStart, addDays } from "../clock.js";
import { UNLOCKS, CRATE_UNLOCK_PREFIX } from "../../data/unlocks.js";

const NS = "http" + "://www.w3.org/2000/svg";
export const ROOMS = ["land", "hw", "read", "zone", "reset"];
export const ROOM_LABELS = { land: "Landing room", hw: "Homework room", read: "Reading nook", zone: "Mission room", reset: "Bedroom" };
// Room boxes in the 320 x 300 view: four windows in a 2 x 2 grid plus the attic room (PICK section 5).
const BOX = {
  land: [62, 222, 84, 56], hw: [174, 222, 84, 56], read: [62, 150, 84, 56], zone: [174, 150, 84, 56], reset: [128, 86, 64, 44],
};

/** How many rooms are lit for a day: same count rule as Today's Run (self or verified). */
export function litCount(day, config) {
  const steps = stepOrder(config, day && day.order);
  return steps.filter((s) => ["self", "verified"].includes(stepStatus(day, s))).length;
}
/** Which rooms are lit: each finished step lights the next room in room order. */
export function litRooms(day, config) {
  return ROOMS.slice(0, litCount(day, config));
}

/** Earned upgrades split by kind. Unknown ids are ignored. */
export function upgrades(unlocks) {
  const out = { theme: null, flag: null, pet: null, sky: null, crate: [] };
  const map = { "room theme": "theme", "roof flag": "flag", pet: "pet", "night sky": "sky" };
  for (const id of unlocks || []) {
    if (id.startsWith(CRATE_UNLOCK_PREFIX)) { out.crate.push(id); continue; }
    const u = UNLOCKS.find((x) => x.id === id);
    if (u && map[u.kind]) out[map[u.kind]] = u.id; // later unlocks of the same kind replace earlier ones
  }
  return out;
}

/** Crate state for a kid and week, mirroring the crate.open rule in rules.js (no reward math here). */
export function crateInfo(kid, week, config, dayKey) {
  const c = config.crate;
  if (kid.crates && kid.crates.includes(week)) return { status: "opened", week };
  const full = Object.keys(kid.days || {}).filter((x) => kid.days[x].full && weekKey(x) === week).sort();
  if (full.length < c.minFullRuns) return { status: "locked", week, have: full.length, need: c.minFullRuns };
  const crateDay = addDays(weekStart(full[0]), (c.day + 6) % 7);
  if (dayKey < crateDay) return { status: "waiting", week, crateDay };
  return { status: "ready", week };
}

/** What the crate shows once open. Straight from rules.crateRoll. */
export function crateShown(kidId, week, config) {
  const r = crateRoll(kidId, week, config);
  return r.kind === "tokens" ? { kind: "tokens", value: r.value, text: "+" + r.value + " tokens" } : { kind: "unlock", value: r.value, text: "New base lantern" };
}

// ---------- SVG helpers ----------
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const k of kids) if (k) el.appendChild(k);
  return el;
}

/** buildBase(lit, ups, opts) -> <svg>. lit: room ids. opts.full raises the flag. */
export function buildBase(lit, ups, opts) {
  const o = opts || {};
  const svg = s("svg", { viewBox: "0 0 320 300", class: "base-art", role: "img", "aria-label": lit.length + " of 5 rooms lit", "data-lit": lit.join(",") });
  // Night sky (shows in dark theme through CSS, always on with the sky upgrade).
  const sky = s("g", { class: "sky" + (ups.sky ? " sky-up" : "") });
  sky.appendChild(s("circle", { cx: 270, cy: 36, r: 16, class: "moon" }));
  const stars = ups.sky ? [[30, 30], [64, 60], [110, 22], [210, 18], [236, 64], [296, 92]] : [[40, 40], [110, 24], [226, 56]];
  for (const [x, y] of stars) sky.appendChild(s("circle", { cx: x, cy: y, r: 2.5, class: "star" }));
  svg.appendChild(sky);
  // Ground, body, roof.
  svg.appendChild(s("rect", { x: 10, y: 284, width: 300, height: 12, rx: 6, class: "ground" }));
  svg.appendChild(s("rect", { x: 46, y: 136, width: 228, height: 150, rx: 12, class: "body" }));
  svg.appendChild(s("path", { d: "M34 140 L160 50 L286 140 Z", class: "roof" }));
  // Rooms.
  ROOMS.forEach((id) => {
    const [x, y, w, hh] = BOX[id];
    const on = lit.includes(id);
    const g = s("g", { class: "room" + (on ? " on" : ""), "data-room": id });
    g.appendChild(s("rect", { x, y, width: w, height: hh, rx: 10, class: "room-fill" }));
    if (on && ups.theme) {
      for (let i = 1; i < 4; i++) g.appendChild(s("line", { x1: x + (w * i) / 4, y1: y + 6, x2: x + (w * i) / 4, y2: y + hh - 6, class: "paper paper-" + ups.theme }));
    }
    g.appendChild(s("line", { x1: x + w / 2, y1: y, x2: x + w / 2, y2: y + hh, class: "mullion" }));
    g.appendChild(s("title", null, document.createTextNode(ROOM_LABELS[id] + (on ? ", lit" : ", dark"))));
    svg.appendChild(g);
  });
  // Door.
  svg.appendChild(s("rect", { x: 146, y: 240, width: 28, height: 46, rx: 8, class: "door" }));
  // Flag pole and flag (raised on a full run; design changes with the flag upgrade).
  svg.appendChild(s("line", { x1: 160, y1: 50, x2: 160, y2: 14, class: "pole" }));
  const fy = o.full ? 14 : 36;
  const flagD = ups.flag === "life-250" ? `M160 ${fy} L196 ${fy + 7} L160 ${fy + 14} L172 ${fy + 7} Z` : ups.flag ? `M160 ${fy} L192 ${fy} L184 ${fy + 7} L192 ${fy + 14} L160 ${fy + 14} Z` : `M160 ${fy} L186 ${fy + 7} L160 ${fy + 14} Z`;
  svg.appendChild(s("path", { d: flagD, class: "flag" + (o.full ? " up" : ""), "data-flag": ups.flag || "plain" }));
  // Pet at the door.
  if (ups.pet) {
    const px = ups.pet === "life-500" ? 196 : 112;
    svg.appendChild(s("g", { class: "pet", "data-pet": ups.pet },
      s("ellipse", { cx: px, cy: 276, rx: 13, ry: 9, class: "pet-body" }),
      s("circle", { cx: px + 11, cy: 266, r: 7, class: "pet-body" }),
      s("circle", { cx: px + 13, cy: 265, r: 1.6, class: "pet-eye" })));
  }
  // Crate lanterns, one per crate unlock (max 4 drawn).
  ups.crate.slice(-4).forEach((id, i) => svg.appendChild(s("g", { class: "lantern", "data-lantern": id },
    s("line", { x1: 66 + i * 14, y1: 136, x2: 66 + i * 14, y2: 118, class: "lantern-cord" }),
    s("rect", { x: 61 + i * 14, y: 118, width: 10, height: 12, rx: 3, class: "lantern-glow" }))));
  return svg;
}

/** buildCrate(state): "closed" | "open". */
export function buildCrate(open) {
  return s("svg", { viewBox: "0 0 120 100", class: "crate-art" + (open ? " open" : ""), "aria-hidden": "true" },
    s("rect", { x: 14, y: 44, width: 92, height: 50, rx: 8, class: "crate-box" }),
    s("line", { x1: 14, y1: 62, x2: 106, y2: 62, class: "crate-slat" }),
    s("line", { x1: 14, y1: 78, x2: 106, y2: 78, class: "crate-slat" }),
    s("circle", { cx: 60, cy: 40, r: 14, class: "crate-burst" }),
    s("rect", { x: 10, y: 30, width: 100, height: 16, rx: 6, class: "crate-lid" }));
}

function crateCard(root, ctx) {
  const k = kidState(ctx);
  const dayKey = dayKeyOf(ctx);
  const week = weekKey(dayKey);
  const info = crateInfo(k, week, ctx.config, dayKey);
  const card = h("section", { class: "card crate-card", "data-crate": info.status });
  card.append(h("h2", null, "Friday Crate"));
  const art = buildCrate(info.status === "opened");
  card.append(art);
  const out = h("p", { class: "crate-result", "data-crate-result": "", role: "status" });
  if (info.status === "opened") {
    const r = crateShown(ctx.kid, week, ctx.config);
    out.textContent = "This week: " + r.text;
    out.dataset.kind = r.kind; out.dataset.value = String(r.value);
  } else if (info.status === "locked") {
    out.textContent = "Finish " + info.need + " full runs this week to earn it. You have " + info.have + ".";
  } else if (info.status === "waiting") {
    out.textContent = "Earned. It opens on Friday.";
  }
  card.append(out);
  const demoPeek = ctx.demo && info.status !== "opened";
  if (info.status === "ready" || demoPeek) {
    card.append(h("button", { type: "button", class: "btn-primary", "data-crate-open": "", onclick: () => {
      if (!demoPeek) emit(ctx, "crate.open", { week });
      const r = crateShown(ctx.kid, week, ctx.config);
      art.classList ? art.classList.add("open") : art.setAttribute("class", "crate-art open");
      out.textContent = (demoPeek ? "Demo peek: " : "You got: ") + r.text;
      out.dataset.kind = r.kind; out.dataset.value = String(r.value);
      setTimeout(() => { if (!demoPeek) mount(root, ctx); }, 900);
    } }, ctx.demo && info.status !== "ready" ? "Open crate (demo)" : "Open crate"));
  }
  return card;
}

/** mount(root, ctx) */
export function mount(root, ctx) {
  clear(root);
  const k = kidState(ctx);
  const day = k.days[dayKeyOf(ctx)] || null;
  const lit = litRooms(day, ctx.config);
  const ups = upgrades(k.unlocks);
  const wrap = h("div", { class: "screen base-screen" });
  wrap.append(h("header", { class: "shop-head" },
    h("button", { type: "button", class: "back btn-secondary", "data-back": "", onclick: () => nav(root, ctx, "today") }, "Back to my run"),
    h("h1", null, "My base"),
    h("div", { class: "run-stats" }, h("span", { class: "chip", "data-streak": "" }, "Streak " + (k.streak || 0)))));
  const slot = h("section", { class: "base-slot base-hero", "data-slot": "base", "data-lit": String(lit.length), "aria-label": lit.length + " of 5 rooms lit" });
  slot.append(buildBase(lit, ups, { full: !!(day && day.full) }));
  wrap.append(slot);
  const list = h("ul", { class: "base-ups" });
  for (const u of UNLOCKS) {
    const have = (k.unlocks || []).includes(u.id);
    list.append(h("li", { class: have ? "have" : "todo", "data-unlock": u.id }, u.name + (have ? " (earned)" : "")));
  }
  wrap.append(h("section", { class: "card" }, h("h2", null, "Upgrades"), list));
  wrap.append(crateCard(root, ctx));
  root.append(wrap);
  return { lit, ups };
}
