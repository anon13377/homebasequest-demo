// Card W1-H. Parent "Today board": both kids, balance, held, streak, each step's status, photo per step.
// mount(root, ctx): ctx = { state, config, device, day, go, demo, ... }. Behind the PIN; kid devices see a refusal.

import { h, gate, shell, kidIds, kidLabel, STATUS_LABELS, STEP_LABELS, dayKeyOf, photoIdFor, photoBox } from "./common.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-board", "Today");
  renderBoard(body, ctx);
  return body;
}

export function renderBoard(body, ctx) {
  const day = dayKeyOf(ctx);
  for (const k of kidIds(ctx)) {
    const kid = ctx.state.kids[k];
    const ds = kid.days[day];
    const list = h("ul", { class: "steps" });
    for (const step of ctx.config.steps) {
      const st = ds ? ds.steps[step] || "todo" : "todo";
      const pid = ctx.config.photoSteps.includes(step) ? photoIdFor(ctx, k, day, step) : null;
      list.append(h("li", { class: "step-row", "data-step": step },
        h("span", { class: "step-name" }, STEP_LABELS[step] || step),
        h("span", { class: "chip st-" + st, "data-status": st }, STATUS_LABELS[st] || st),
        pid ? photoBox(ctx, pid) : null));
    }
    body.append(h("section", { class: "card pcard kid-" + k, "data-kid": k },
      h("h2", null, h("span", { class: "kid-dot", "aria-hidden": "true" }, k.toUpperCase()), " " + kidLabel(ctx, k)),
      h("p", { class: "stats" },
        h("span", { class: "coin-chip", "data-balance": "" }, kid.balance + " tokens"), " ",
        h("span", { class: "chip", "data-held": "" }, kid.held + " on hold"), " ",
        h("span", { class: "chip", "data-streak": "" }, "Streak " + kid.streak)),
      ds ? null : h("p", { class: "muted", "data-notstarted": "" }, "Not started yet today."),
      list));
  }
}
