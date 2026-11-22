// Card W1-H. Check queue: every step waiting for a check, its photo (fetched only after the PIN, by POST photoGet),
// Pass, or Fix list with the exact tasks ticked. Writes check.pass / check.fix events only.

import { h, gate, shell, act, checkQueue, kidLabel, STEP_LABELS, photoBox } from "./common.js";
import { TASKS, DAYS } from "../../data/tasks.js";
import { weekday } from "../clock.js";
import { SUBJECT_LABELS } from "../ui/today.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-checks", "Check queue");
  renderChecks(body, ctx, () => draw(root, ctx));
  return body;
}

/** The fixable items for one queued step: task ids (zone, reset) or subject ids (homework). */
export function fixItems(ctx, q) {
  if (q.step === "hw") return (ctx.config.homeworkSubjects || []).map((id) => ({ id, text: SUBJECT_LABELS[id] || id }));
  if (q.step !== "zone" && q.step !== "reset") return [];
  const dayId = (DAYS.find((d) => d.day === weekday(q.day)) || {}).id;
  return TASKS.filter((t) => t.dayId === dayId && t.kid === q.kid && t.step === q.step).map((t) => ({ id: t.id, text: t.text }));
}

export function renderChecks(body, ctx, rerender) {
  const queue = checkQueue(ctx);
  if (!queue.length) { body.append(h("p", { class: "muted", "data-empty": "" }, "Nothing waiting for a check.")); return; }
  for (const q of queue) {
    const picks = new Set();
    const fixBox = h("div", { class: "fixlist", "data-fixlist": "", hidden: "" });
    for (const it of fixItems(ctx, q)) {
      fixBox.append(h("label", { class: "fix-item" },
        h("input", { type: "checkbox", "data-fixitem": it.id, onclick: (e) => { if (picks.has(it.id)) picks.delete(it.id); else picks.add(it.id); } }),
        " " + String(it.text).replace(/<\/?b>/gi, "")));
    }
    fixBox.append(h("button", { type: "button", class: "btn-danger", "data-sendfix": "", onclick: () =>
      act(body, ctx, rerender, q.kid, "check.fix", { step: q.step, day: q.day, items: [...picks] }, "Sent to " + kidLabel(ctx, q.kid) + " as a fix list.") }, "Send fix list"));
    const fixBtn = h("button", { type: "button", class: "btn-secondary", "data-fix": "", onclick: () => { fixBox.hidden = false; } }, "Fix list");
    body.append(h("section", { class: "card pcard kid-" + q.kid, "data-check": q.kid + "|" + q.day + "|" + q.step, "data-kid": q.kid },
      h("h2", null, kidLabel(ctx, q.kid) + ": " + (STEP_LABELS[q.step] || q.step)),
      h("p", { class: "muted" }, q.day),
      photoBox(ctx, q.photo),
      h("div", { class: "btn-row" },
        h("button", { type: "button", class: "btn-success", "data-pass": "", onclick: () =>
          act(body, ctx, rerender, q.kid, "check.pass", { step: q.step, day: q.day }, "Passed.") }, "Pass"),
        fixBtn),
      fixBox));
  }
}
