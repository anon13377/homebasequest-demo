// Card W1-D. Kid screen "step": checklist, timer, photo panel and the Done button for one step of the run.
// Timers: zone and reset show the mission cap (E 20, M 15 minutes, from config) and never block the kid:
// when the cap runs out the step counts anyway. Reading (20) and brain time (15, no homework day) must
// finish. Photo capture is W1-P: this screen mounts js/ui/photo.js through
//   mount(panel, { config, kid, day, step, demo, onPhoto(photoId), onClear() })
// and only needs the id back. step.done items: task ids for zone and reset, subject ids for homework,
// "land-1".."land-4" for Land (no task ids exist for those, see report).

import { now, mmss } from "../clock.js";
import {
  h, rich, clear, emit, nav, eventsOf, dayKeyOf, kidState, dayState, currentStep, tasksFor, notesFor,
  dayInfo, hwInfo, stepStatus, STEP_LABELS, SUBJECT_LABELS, LAND_ITEMS,
} from "./today.js";

const memTimers = new Map();
const tkey = (ctx, step, fix) => "hbqdemo:timer:" + ctx.kid + ":" + dayKeyOf(ctx) + ":" + step + (fix ? ":fix" : "");
function loadTimer(k) {
  try {
    const v = globalThis.localStorage && globalThis.localStorage.getItem(k);
    if (v) return JSON.parse(v);
  } catch (e) { /* blocked: use memory */ }
  return memTimers.get(k) || null;
}
function saveTimer(k, t) {
  memTimers.set(k, t);
  try { if (globalThis.localStorage) globalThis.localStorage.setItem(k, JSON.stringify(t)); } catch (e) { /* convenience only */ }
}
const elapsed = (t) => (t ? Math.floor((t.acc + (t.since ? now() - t.since : 0)) / 1000) : 0);

export const CAP_MESSAGE = "Good stop. The rest goes to Saturday or to an adult.";
export const PHOTO_LINE = "Photo of the room or the page. No people in the photo.";

/** Test hook: forget remembered timers (they are per kid, day and step). */
export function resetTimers() { memTimers.clear(); }

export function unmount(root) {
  if (root && root._hbqTimer) { clearInterval(root._hbqTimer); root._hbqTimer = null; }
  if (root) root._hbqTick = null;
}

function fixItemIds(ctx, step) {
  const list = eventsOf(ctx).filter((e) => e && e.type === "check.fix" && e.kid === ctx.kid && e.data && e.data.step === step);
  const last = list[list.length - 1];
  return last && Array.isArray(last.data.items) && last.data.items.length ? last.data.items : null;
}

export function mount(root, ctx) {
  unmount(root);
  const cfg = ctx.config, kidId = ctx.kid, dayKey = dayKeyOf(ctx);
  let step = ctx.step;
  if (!step && ctx.demo) {
    try { step = new URLSearchParams(globalThis.location.search).get("step") || null; } catch (e) { step = null; }
  }
  step = step || currentStep(ctx);
  if (!step || !STEP_LABELS[step]) return nav(root, ctx, "today");
  const day = dayState(ctx);
  const status = stepStatus(day, step);
  const hw = hwInfo(ctx);
  if (step === "hw" && !hw && status === "todo") return nav(root, ctx, "homework");

  const fixing = status === "fix";
  const fixIds = fixing ? fixItemIds(ctx, step) : null;
  let items = [];
  if (step === "land") items = LAND_ITEMS.slice();
  else if (step === "hw") items = hw && !hw.none ? hw.subjects.map((id) => ({ id, text: SUBJECT_LABELS[id] || id })) : [];
  else if (step === "zone" || step === "reset") items = tasksFor(dayKey, kidId, step).map((t) => ({ id: t.id, text: t.text }));
  if (fixIds) items = items.filter((i) => fixIds.includes(i.id));

  const missionStep = step === "zone" || step === "reset";
  const spec = step === "read" ? { kind: "must", min: cfg.timers.reading, pausable: true, label: "Reading time" }
    : step === "hw" && hw && hw.none ? { kind: "must", min: cfg.timers.brainTime, pausable: true, label: "Brain time" }
    : missionStep ? { kind: "cap", min: cfg.timers.missionCap[kidId], pausable: false, label: "Mission cap" }
    : null;
  const needsPhoto = cfg.photoSteps.includes(step) && !(step === "hw" && hw && hw.none);
  const doneAlready = status === "self" || status === "verified";

  const ticked = new Set();
  let photoId = null;
  const openedAt = now();
  const key = tkey(ctx, step, fixing);
  if (spec && spec.kind === "cap" && !loadTimer(key)) saveTimer(key, { acc: 0, since: now() });

  clear(root);
  const info = dayInfo(dayKey);
  const title = step === "reset" && info && info.resetTitle ? info.resetTitle[kidId] : STEP_LABELS[step];
  const card = h("section", { class: "card step-screen", "data-step": step, "data-status": status });
  card.append(h("button", { type: "button", class: "back", "data-back": "", onclick: () => { unmount(root); nav(root, ctx, "today"); } }, "Back to my run"));
  card.append(h("h1", null, title));
  if (info && step === "zone") card.append(h("p", { class: "muted" }, info.zone + " : " + info.room));
  if (info && info.rule && missionStep) card.append(h("p", { class: "rule-line" }, info.rule));
  if (fixing) card.append(h("p", { class: "fix-banner", role: "status" }, "Fix list. Redo only the items below, then tap Done."));

  if (doneAlready) {
    card.append(h("p", { class: "done-note", role: "status" }, status === "verified" ? "Checked. Nice work." : "Done. Waiting for Dad's check."));
    card.append(h("button", { type: "button", class: "btn-primary", onclick: () => nav(root, ctx, "today") }, "Back to my run"));
    root.append(card);
    return;
  }

  if (missionStep) {
    for (const n of notesFor(dayKey, items.map((i) => i.id))) {
      card.append(h("div", { class: "safety-note", role: "note" }, h("strong", null, n.head), " ", rich(h("span", null), n.body)));
    }
  }

  let timerText = null, meterFill = null, capMsg = null, pauseBtn = null;
  if (spec) {
    timerText = h("span", { class: "timer num", role: "timer", "data-timer": "" }, mmss(spec.min * 60));
    meterFill = h("span", { class: "meter-fill" });
    capMsg = h("p", { class: "cap-msg", role: "status", "data-cap": "" });
    const timerBox = h("div", { class: "timer-box", "data-kind": spec.kind },
      h("div", { class: "timer-row" }, h("span", { class: "label" }, spec.label), timerText),
      h("div", { class: "meter", "aria-hidden": "true" }, meterFill), capMsg);
    if (spec.pausable) {
      pauseBtn = h("button", { type: "button", class: "btn-secondary", "data-pause": "", onclick: () => {
        const t = loadTimer(key) || { acc: 0, since: null };
        if (t.since) saveTimer(key, { acc: t.acc + (now() - t.since), since: null });
        else saveTimer(key, { acc: t.acc, since: now() });
        tick();
      } }, "Start");
      timerBox.append(pauseBtn);
    }
    card.append(timerBox);
  }

  const list = h("ul", { class: "checklist" });
  for (const it of items) {
    const b = h("button", { type: "button", class: "check-row", role: "checkbox", "aria-checked": "false", "data-item": it.id, onclick: () => {
      if (ticked.has(it.id)) ticked.delete(it.id); else ticked.add(it.id);
      b.setAttribute("aria-checked", ticked.has(it.id) ? "true" : "false");
      refresh();
    } }, h("span", { class: "box", "aria-hidden": "true" }, ""), rich(h("span", { class: "check-text" }), it.text));
    list.append(h("li", null, b));
  }
  if (items.length) card.append(list);
  if (step === "read") card.append(h("p", { class: "muted" }, "Read for the full time. Tap Start, and Pause if you need a break."));
  if (spec && spec.label === "Brain time") card.append(h("p", { class: "muted" }, "No homework today: do brain time. Spell Hatch, math facts, or extra reading."));

  let photoNote = null;
  if (needsPhoto) {
    photoNote = h("p", { class: "photo-status", "data-photo-status": "" }, "Photo needed");
    const body = h("div", { class: "photo-body" });
    card.append(h("div", { class: "photo-panel", "data-photo": "" },
      h("h2", null, "Photo"), h("p", { class: "photo-line" }, PHOTO_LINE), photoNote, body));
    const pctx = {
      config: cfg, kid: kidId, day: dayKey, step, demo: !!ctx.demo,
      onPhoto: (id) => { photoId = id || null; photoNote.textContent = photoId ? "Photo ready" : "Photo needed"; refresh(); },
      onClear: () => { photoId = null; photoNote.textContent = "Photo needed"; refresh(); },
    };
    Promise.resolve(ctx.photoUi || import("./photo.js")).then((m) => m.mount(body, pctx))
      .catch(() => body.append(h("p", { class: "muted" }, "The camera is not ready yet.")));
  }

  const hint = h("p", { class: "muted hint", "data-hint": "" });
  const done = h("button", { type: "button", class: "btn-primary", "data-done": "", disabled: true, onclick: () => finish() }, "Done");
  card.append(hint, done);
  root.append(card);

  function state() {
    const t = spec ? loadTimer(key) : null;
    const secs = elapsed(t);
    const capSecs = spec ? spec.min * 60 : 0;
    const timeUp = !!spec && secs >= capSecs;
    const allTicked = items.every((i) => ticked.has(i.id));
    let ok = true, why = "";
    if (spec && spec.kind === "must" && !timeUp) { ok = false; why = "Finish the timer first."; }
    else if (spec && spec.kind === "cap" && !(allTicked || timeUp)) { ok = false; why = "Tick every item, or wait for the timer."; }
    else if (!(spec && spec.kind === "cap") && !allTicked) { ok = false; why = "Tick every item."; }
    if (ok && needsPhoto && !photoId) { ok = false; why = "Photo needed."; }
    return { t, secs, capSecs, timeUp, ok, why };
  }
  function refresh() {
    const s = state();
    done.disabled = !s.ok;
    hint.textContent = s.ok ? "" : s.why;
    return s;
  }
  function tick() {
    const s = refresh();
    if (!spec) return;
    timerText.textContent = mmss(Math.max(0, s.capSecs - s.secs));
    meterFill.style.width = Math.min(100, Math.round((s.secs / s.capSecs) * 100)) + "%";
    capMsg.textContent = s.timeUp ? (spec.kind === "cap" ? CAP_MESSAGE : "Time is up. Nice reading.") : "";
    if (pauseBtn) {
      pauseBtn.textContent = s.timeUp ? "Finished" : s.t && s.t.since ? "Pause" : s.secs ? "Resume" : "Start";
      pauseBtn.disabled = s.timeUp;
    }
  }

  function finish() {
    const s = refresh();
    if (!s.ok) return;
    const before = kidState(ctx).balance;
    emit(ctx, "step.done", {
      step, items: items.filter((i) => ticked.has(i.id)).map((i) => i.id),
      seconds: spec ? s.secs : Math.max(0, Math.floor((now() - openedAt) / 1000)), photo: needsPhoto ? photoId : null,
    });
    unmount(root);
    const gain = kidState(ctx).balance - before;
    const st = stepStatus(dayState(ctx), step);
    const msg = st === "todo" ? "Not counted yet. It still needs a photo."
      : gain > 0 ? "+" + gain + " tokens"
      : st === "self" && (cfg.checkSteps || []).includes(step) && cfg.payOn[kidId] === "verified" ? "Waiting for Dad's check. Tokens come after."
      : "Saved.";
    clear(root);
    root.append(h("section", { class: "card step-result", role: "status", "data-gain": String(gain) },
      h("h1", null, "Nice work"), h("p", { class: "result-line" }, msg),
      h("button", { type: "button", class: "btn-primary", onclick: () => nav(root, ctx, "today") }, "Back to my run")));
  }

  root._hbqTick = tick;
  if (spec) {
    root._hbqTimer = setInterval(tick, 1000);
    if (root._hbqTimer && root._hbqTimer.unref) root._hbqTimer.unref();
  }
  tick();
}
