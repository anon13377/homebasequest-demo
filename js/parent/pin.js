// Card W1-H. PIN lock for Parent mode. The PIN is only a screen lock (SCOPE section 8); the server is the real gate.
// Stored on the device as { salt, hash } under device.pin. Wrong tries slow down. Unlock lasts 10 minutes.

import { h, clear, isParentDevice, goto } from "./common.js";
import * as store from "../store.js";

const LIFE_MS = 10 * 60 * 1000;
let unlockedAt = 0, fails = 0, lockedUntil = 0;

export const isUnlocked = () => unlockedAt > 0 && Date.now() - unlockedAt < LIFE_MS;
export function lock() { unlockedAt = 0; }
export const hasPin = (ctx) => !!(ctx.device && ctx.device.pin && ctx.device.pin.hash);
export const validPin = (p) => typeof p === "string" && /^[0-9]{4,8}$/.test(p);

async function digest(salt, pin) {
  const data = new TextEncoder().encode("hbq|" + salt + "|" + pin);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function newSalt() {
  const a = new Uint8Array(12);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setPin(ctx, pin) {
  if (!validPin(pin)) return false;
  const salt = newSalt();
  const next = Object.assign({}, ctx.device, { pin: { salt, hash: await digest(salt, pin) } });
  if (!ctx.demo) store.saveDevice(next);
  ctx.device = next;
  unlockedAt = Date.now();
  return true;
}
export async function check(ctx, pin) {
  if (Date.now() < lockedUntil) return false;
  if (!hasPin(ctx) || !validPin(pin)) return false;
  const ok = (await digest(ctx.device.pin.salt, pin)) === ctx.device.pin.hash;
  if (ok) { fails = 0; unlockedAt = Date.now(); return true; }
  fails++;
  if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; }
  return false;
}
export const _reset = () => { unlockedAt = 0; fails = 0; lockedUntil = 0; };

/** mount(root, ctx): the lock screen (or the set-a-PIN screen the first time). After success it opens the board. */
export async function mount(root, ctx) {
  clear(root);
  if (!isParentDevice(ctx)) {
    root.append(h("section", { class: "parent-shell card", "data-kid-refused": "" }, h("h1", null, "Parents only"),
      h("p", { class: "muted" }, "This is a kid device. Parent tools are not available here.")));
    return;
  }
  const first = !hasPin(ctx);
  const pinAttrs = { type: "password", inputmode: "numeric", autocomplete: "off", maxlength: "8", class: "pin-input" };
  const input = h("input", Object.assign({ "data-pin": "", "aria-label": first ? "Choose a PIN" : "PIN" }, pinAttrs));
  const input2 = first ? h("input", Object.assign({ "data-pin2": "", "aria-label": "Type the PIN again" }, pinAttrs)) : null;
  const msg = h("p", { class: "pmsg", role: "status", "data-msg": "" });
  const go = h("button", { type: "button", class: "btn-primary", "data-unlock": "", onclick: async () => {
    const p = input.value || "";
    if (first) {
      if (!validPin(p)) { msg.textContent = "Use 4 to 8 digits."; return; }
      if (p !== (input2.value || "")) { msg.textContent = "The two PINs do not match."; return; }
      await setPin(ctx, p);
      return goto(root, ctx, "parent-board");
    }
    if (Date.now() < lockedUntil) { msg.textContent = "Too many tries. Wait a little."; return; }
    if (await check(ctx, p)) return goto(root, ctx, "parent-board");
    msg.textContent = Date.now() < lockedUntil ? "Too many tries. Wait a little." : "That PIN is not right.";
    input.value = "";
  } }, first ? "Save PIN" : "Open Parent mode");
  root.append(h("section", { class: "parent-shell card pin-card", "data-view": "pin" },
    h("h1", null, first ? "Choose a PIN" : "Parent mode"),
    h("p", { class: "muted" }, first ? "This PIN only locks the screen on this device." : "Enter your PIN."),
    h("label", { class: "label" }, first ? "New PIN" : "PIN", input),
    input2 ? h("label", { class: "label" }, "Again", input2) : null, go, msg));
}
