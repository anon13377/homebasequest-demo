// Card W1-H. Editors: shop (name, price, limit count), token values, daily max, schedule times, school days.
// Every save is ONE config.set event { path, value } and nothing else (the editors never write any other event type).
// Task text is not in config (data/tasks.js), so tasks are edited by hand in that file (known gap, see report).

import { h, gate, shell, act } from "./common.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-editors", "Editors");
  renderEditors(body, ctx, () => draw(root, ctx));
  return body;
}

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
/** kind: int (min,max), time, text. -> { ok, value } */
export function parseField(kind, raw, opt) {
  const s = String(raw === undefined || raw === null ? "" : raw).trim();
  if (kind === "int") {
    if (!/^-?[0-9]+$/.test(s)) return { ok: false };
    const n = Number(s);
    return n >= opt.min && n <= opt.max ? { ok: true, value: n } : { ok: false };
  }
  if (kind === "time") return TIME_RE.test(s) ? { ok: true, value: s } : { ok: false };
  if (kind === "text") return s.length >= 1 && s.length <= 60 ? { ok: true, value: s } : { ok: false };
  return { ok: false };
}

const TOKEN_LABELS = { land: "Land", hw: "Homework", read: "Reading", zone: "Zone Mission", reset: "Room Reset",
  selfStart: "Self Start bonus", runComplete: "Run complete bonus", perfectWeek: "Perfect Week", teamWeek: "Team Week", kitchenClosed: "Kitchen Closed" };

function field(body, ctx, rerender, label, path, kind, current, opt) {
  const input = h("input", { type: kind === "int" ? "number" : "text", class: "num-in", "data-path": path.split(".").join("_"), "aria-label": label, value: String(current), maxlength: kind === "text" ? "60" : null });
  input.value = String(current);
  return h("div", { class: "field" },
    h("label", { class: "label" }, label, input),
    h("button", { type: "button", class: "btn-secondary", "data-save": path.split(".").join("_"), onclick: () => {
      const r = parseField(kind, input.value, opt);
      if (!r.ok) { body.say(label + ": that value is not allowed."); return; }
      return act(body, ctx, rerender, null, "config.set", { path, value: r.value }, label + " saved.");
    } }, "Save"));
}

export function renderEditors(body, ctx, rerender) {
  const cfg = ctx.config;
  const shop = h("section", { class: "card", "data-editor": "shop" }, h("h2", null, "Reward Shop"));
  cfg.shop.forEach((it, i) => {
    shop.append(h("div", { class: "subcard", "data-shop": it.id },
      field(body, ctx, rerender, it.name + ": name", "shop." + i + ".name", "text", it.name),
      field(body, ctx, rerender, it.name + ": price", "shop." + i + ".price", "int", it.price, { min: 1, max: 2000 }),
      it.limit ? field(body, ctx, rerender, it.name + ": limit count", "shop." + i + ".limit.count", "int", it.limit.count, { min: 1, max: 20 }) : null));
  });
  const tok = h("section", { class: "card", "data-editor": "tokens" }, h("h2", null, "Token values"));
  for (const key of Object.keys(cfg.tokens)) tok.append(field(body, ctx, rerender, TOKEN_LABELS[key] || key, "tokens." + key, "int", cfg.tokens[key], { min: 0, max: 50 }));
  tok.append(field(body, ctx, rerender, "Most tokens in one day", "dailyMax", "int", cfg.dailyMax, { min: 1, max: 200 }));
  const sch = h("section", { class: "card", "data-editor": "schedule" }, h("h2", null, "Schedule"));
  for (const [key, label] of [["start", "Start time"], ["dinnerCutoff", "Dinner cutoff"], ["digest", "Evening digest"], ["sundaySummary", "Sunday summary"]]) {
    sch.append(field(body, ctx, rerender, label + " (24 hour, like 15:45)", "times." + key, "time", cfg.times[key]));
  }
  sch.append(field(body, ctx, rerender, "Minutes before the Not Started nudge", "times.nudgeAfterMin", "int", cfg.times.nudgeAfterMin, { min: 5, max: 180 }));
  body.append(shop, tok, sch);
}
