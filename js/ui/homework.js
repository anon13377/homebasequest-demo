// Card W1-D. Kid screen "homework": pick today's subjects from chips (no free text), or "No homework today".
// Emits hw.set { subjects, none }, then opens the homework step.

import { h, clear, emit, nav, SUBJECT_LABELS } from "./today.js";

export function mount(root, ctx) {
  const picked = new Set();
  let none = false;
  clear(root);
  const chips = h("div", { class: "chip-grid", role: "group", "aria-label": "Homework subjects" });
  const noneBtn = h("button", { type: "button", class: "chip-btn none", "data-none": "", "aria-pressed": "false" }, "No homework today");
  const ok = h("button", { type: "button", class: "btn-primary", "data-confirm": "", disabled: true }, "That is my list");
  const hint = h("p", { class: "muted hint" }, "Pick at least one.");

  function sync() {
    for (const b of chips.querySelectorAll("[data-subject]")) b.setAttribute("aria-pressed", picked.has(b.getAttribute("data-subject")) ? "true" : "false");
    noneBtn.setAttribute("aria-pressed", none ? "true" : "false");
    ok.disabled = !(none || picked.size > 0);
    hint.textContent = none ? "No homework: you will do 15 minutes of brain time instead." : picked.size ? "Tap again to un-pick." : "Pick at least one.";
  }
  for (const id of ctx.config.homeworkSubjects) {
    chips.append(h("button", {
      type: "button", class: "chip-btn", "data-subject": id, "aria-pressed": "false",
      onclick: () => { none = false; if (picked.has(id)) picked.delete(id); else picked.add(id); sync(); },
    }, SUBJECT_LABELS[id] || id));
  }
  noneBtn.addEventListener("click", () => { none = !none; if (none) picked.clear(); sync(); });
  ok.addEventListener("click", () => {
    if (ok.disabled) return;
    emit(ctx, "hw.set", { subjects: none ? [] : Array.from(picked), none });
    nav(root, ctx, "step", { step: "hw" });
  });

  root.append(h("section", { class: "card homework" },
    h("button", { type: "button", class: "back", onclick: () => nav(root, ctx, "today") }, "Back to my run"),
    h("h1", null, "What homework do you have?"), chips, noneBtn, hint, ok));
  sync();
}
