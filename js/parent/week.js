// Card W1-H. Week view: school days of this week per kid with step statuses and tokens earned; mark a day off;
// give or take tokens with a reason (adjust); award the Kitchen Closed team bonus. Events: day.off, adjust, bonus.team.

import { h, gate, shell, act, kidIds, kidLabel, dayKeyOf, STATUS_LABELS } from "./common.js";
import { weekStart, addDays, isSchoolDay, weekday } from "../clock.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-week", "This week");
  renderWeek(body, ctx, () => draw(root, ctx));
  return body;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function renderWeek(body, ctx, rerender) {
  const start = weekStart(dayKeyOf(ctx));
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    if (!isSchoolDay(day, ctx.config)) continue;
    const card = h("section", { class: "card pcard", "data-day": day },
      h("h2", null, DAY_NAMES[weekday(day)] + " " + day));
    for (const k of kidIds(ctx)) {
      const ds = ctx.state.kids[k].days[day];
      const line = h("p", { class: "weekline kid-" + k, "data-kid": k }, h("b", null, kidLabel(ctx, k) + ": "));
      if (!ds) line.append(h("span", { class: "muted", "data-none": "" }, "No run"));
      else if (ds.off) line.append(h("span", { class: "chip", "data-off": "" }, "Day off"));
      else {
        line.append(h("span", { class: "chip" + (ds.full ? " st-verified" : ""), "data-full": ds.full ? "yes" : "no" }, ds.full ? "Full run" : "Partial"), " ",
          h("span", { class: "chip", "data-earned": "" }, ds.earned + " tokens"), " ");
        const waiting = Object.values(ds.steps).filter((s) => s === "self").length;
        const fix = Object.values(ds.steps).filter((s) => s === "fix").length;
        if (waiting) line.append(h("span", { class: "chip st-self" }, waiting + " " + STATUS_LABELS.self.toLowerCase()), " ");
        if (fix) line.append(h("span", { class: "chip st-fix" }, fix + " " + STATUS_LABELS.fix.toLowerCase()));
      }
      card.append(line);
    }
    const why = h("input", { type: "text", maxlength: "60", class: "reason", "data-why": "", "aria-label": "Why a day off", placeholder: "Why (sick, trip...)" });
    card.append(why, h("button", { type: "button", class: "btn-secondary", "data-dayoff": day, onclick: () => {
      const w = String(why.value || "").trim();
      if (!w) { body.say("Add a short reason for the day off."); return; }
      return act(body, ctx, rerender, null, "day.off", { day, why: w }, "Marked a day off.");
    } }, "Mark day off"));
    body.append(card);
  }

  // Tokens: adjust and Kitchen Closed
  const kidSel = h("select", { class: "kid-sel", "data-adj-kid": "", "aria-label": "Which kid" });
  for (const k of kidIds(ctx)) kidSel.append(h("option", { value: k }, kidLabel(ctx, k)));
  const amt = h("input", { type: "number", step: "1", class: "num-in", "data-adj-tokens": "", "aria-label": "Tokens, plus or minus", placeholder: "Tokens (+ or -)" });
  const rsn = h("input", { type: "text", maxlength: "80", class: "reason", "data-adj-reason": "", "aria-label": "Reason", placeholder: "Reason (required)" });
  body.append(h("section", { class: "card", "data-adjust": "" },
    h("h2", null, "Give or take tokens"), kidSel, amt, rsn,
    h("button", { type: "button", class: "btn-primary", "data-adj-send": "", onclick: () => {
      const n = Number(amt.value), r = String(rsn.value || "").trim();
      if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 100) { body.say("Use a whole number from 1 to 100, plus or minus."); return; }
      if (!r) { body.say("A reason is required."); return; }
      return act(body, ctx, rerender, kidSel.value || kidIds(ctx)[0], "adjust", { tokens: n, reason: r }, "Tokens adjusted.");
    } }, "Save adjustment")));
  body.append(h("section", { class: "card", "data-bonus": "" },
    h("h2", null, "Kitchen Closed bonus"),
    h("p", { class: "muted" }, "Both kids get " + ctx.config.tokens.kitchenClosed + " tokens, once a day."),
    h("button", { type: "button", class: "btn-secondary", "data-kitchen": "", onclick: () =>
      act(body, ctx, rerender, null, "bonus.team", { key: "kitchen-closed" }, "Bonus given.") }, "Kitchen was closed")));
}
