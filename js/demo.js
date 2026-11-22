// demo.js (card W0): ?demo=<screen> mounts any screen with fixture state, so UI cards work before W2.
// Not loaded at all unless the URL has ?demo=.

import { CONFIG } from "../data/config.js";
import { setNow } from "./clock.js";
import { DEMO_STATE, DEMO_NOW, DEMO_DAY, DEMO_DEVICE, DEMO_PARENT_DEVICE } from "../tests/fixtures/demo-state.js";

export const SCREENS = {
  who: "./ui/who.js", today: "./ui/today.js", step: "./ui/step.js", homework: "./ui/homework.js",
  base: "./ui/base.js", shop: "./ui/shop.js", tickets: "./ui/tickets.js", history: "./ui/history.js",
  photo: "./ui/photo.js", setup: "./setup.js",
  parent: "./parent/board.js", "parent-board": "./parent/board.js", "parent-checks": "./parent/checks.js",
  "parent-requests": "./parent/requests.js", "parent-week": "./parent/week.js",
  "parent-editors": "./parent/editors.js", "parent-devices": "./parent/devices.js",
  "parent-settings": "./parent/settings.js", "parent-pin": "./parent/pin.js",
};

function note(root, title, text) {
  root.textContent = "";
  const card = document.createElement("section");
  card.className = "card";
  const h = document.createElement("h1");
  h.textContent = title;
  const p = document.createElement("p");
  p.className = "muted";
  p.textContent = text;
  card.append(h, p);
  root.append(card);
}

export async function mountDemo(root, screen) {
  setNow(DEMO_NOW);
  const path = SCREENS[screen];
  if (!path) {
    note(root, "Demo", "Unknown screen. Try one of: " + Object.keys(SCREENS).join(", "));
    return { ok: false, why: "unknown" };
  }
  const parent = screen === "parent" || screen.startsWith("parent-");
  const ctx = {
    demo: true,
    config: CONFIG,
    state: structuredClone(DEMO_STATE),
    day: DEMO_DAY,
    kid: "e",
    device: parent ? DEMO_PARENT_DEVICE : DEMO_DEVICE,
    go: (next) => mountDemo(root, next),
  };
  document.documentElement.dataset.mode = parent ? "parent" : "kid";
  try {
    const mod = await import(path);
    await mod.mount(root, ctx);
    return { ok: true };
  } catch (err) {
    const msg = String(err && err.message || err);
    note(root, "Demo: " + screen, msg.startsWith("not implemented") ? "This screen is not built yet." : "Error: " + msg);
    return { ok: false, why: msg };
  }
}
