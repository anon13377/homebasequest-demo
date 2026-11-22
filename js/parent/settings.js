// Card W1-H. Settings: notification switches (config.set on pushes.*), change PIN, lock now.

import { h, gate, shell, act } from "./common.js";
import * as pin from "./pin.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-settings", "Settings");
  renderSettings(body, ctx, () => draw(root, ctx));
  return body;
}

const PUSH_LABELS = {
  started: "A run started", needsCheck: "A step needs a check", request: "A reward request", runComplete: "A run is complete",
  notStarted: "Not started nudge", digest: "Evening digest", sunday: "Sunday summary",
};

export function renderSettings(body, ctx, rerender) {
  const sec = h("section", { class: "card", "data-editor": "notifications" }, h("h2", null, "Notifications"));
  for (const key of Object.keys(PUSH_LABELS)) {
    const on = !!ctx.config.pushes[key];
    sec.append(h("div", { class: "field" },
      h("span", { class: "label" }, PUSH_LABELS[key]),
      h("button", { type: "button", class: on ? "btn-success" : "btn-secondary", "data-push": key, "aria-pressed": on ? "true" : "false",
        onclick: () => act(body, ctx, rerender, null, "config.set", { path: "pushes." + key, value: !on }, PUSH_LABELS[key] + (on ? " is off." : " is on.")) }, on ? "On" : "Off")));
  }
  const cur = h("input", { type: "password", inputmode: "numeric", maxlength: "8", class: "pin-input", "data-oldpin": "", "aria-label": "Current PIN" });
  const nw = h("input", { type: "password", inputmode: "numeric", maxlength: "8", class: "pin-input", "data-newpin": "", "aria-label": "New PIN" });
  const pinSec = h("section", { class: "card", "data-editor": "pin" }, h("h2", null, "PIN"),
    h("label", { class: "label" }, "Current PIN", cur), h("label", { class: "label" }, "New PIN", nw),
    h("button", { type: "button", class: "btn-secondary", "data-changepin": "", onclick: async () => {
      if (!pin.validPin(nw.value || "")) { body.say("The new PIN needs 4 to 8 digits."); return; }
      if (!(await pin.check(ctx, cur.value || ""))) { body.say("The current PIN is not right."); return; }
      await pin.setPin(ctx, nw.value);
      body.say("PIN changed.");
    } }, "Change PIN"),
    h("button", { type: "button", class: "btn-secondary", "data-locknow": "", onclick: () => { pin.lock(); body.say("Locked."); } }, "Lock now"));
  body.append(sec, pinSec);
}
