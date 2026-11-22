// Card W2. First run wizard: local only or Parent Link, kid initials, pair by QR or typed code.
// Pairing text from a parent device: hbq1|<backend url>|<family key>|<code>|<role> (devices.js pairText).
// The code is claimed ONCE (POST claim); the claim reply is the only reply that carries a key. Keys are kept only
// in the device record (store.saveDevice) and are never shown, logged or put in a URL.

import { h, clear } from "./ui/today.js";
import { parsePairText } from "./parent/devices.js";
import * as store from "./store.js";

const INITIAL = /^[A-Z]$/;

export function cleanInitial(v, dflt) {
  const s = String(v || "").trim().toUpperCase().slice(0, 1);
  return INITIAL.test(s) ? s : dflt;
}

/** Only https backends (or localhost while testing) are accepted. */
export function okUrl(u) {
  try {
    const x = new URL(String(u || ""));
    return x.protocol === "https:" || (x.protocol === "http:" && (x.hostname === "127.0.0.1" || x.hostname === "localhost"));
  } catch (e) { return false; }
}

async function post(ctx, url, body) {
  const f = ctx.fetch || globalThis.fetch.bind(globalThis);
  const r = await f(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) });
  return r.json();
}

/** Claim a pairing code once. -> { ok, device?, why? } (device is not saved yet: the kid pick comes first) */
export async function claim(ctx, text) {
  const p = parsePairText(text);
  if (!p || !okUrl(p.url)) return { ok: false, why: "That code is not a Home Base Quest pairing code." };
  let rep;
  try {
    rep = await post(ctx, p.url, { op: "claim", fk: p.fk, code: p.code });
  } catch (e) { return { ok: false, why: "Could not reach the server. Check the internet and try again." }; }
  if (!rep || !rep.ok || typeof rep.key !== "string" || !rep.key) {
    const why = rep && rep.why === "expired" ? "That code expired. Ask for a new one." : "That code did not work. It may be used already. Ask for a new one.";
    return { ok: false, why };
  }
  const role = rep.role === "parent" ? "parent" : "kid";
  const device = { mode: "link", role, backendUrl: p.url, familyKey: p.fk, kidIds: [] };
  if (role === "parent") device.parentSecret = rep.key; else { device.kidKey = rep.key; if (typeof rep.kid === "string") device.kidIds = [rep.kid]; }
  return { ok: true, device };
}

/** Keys are lowercase letter and digit groups joined by dashes; drop spaces and phone auto capitals. */
function normKey(k) { return String(k || "").replace(/\s+/g, "").toLowerCase(); }

/** First parent phone: typed url, family key and parent secret (from backend SETUP.md). Checked with one pull. */
export async function firstParent(ctx, url, fk, secret) {
  if (!okUrl(url)) return { ok: false, why: "The web app address should start with https." };
  fk = normKey(fk); secret = normKey(secret);
  if (!/^[a-z0-9-]{20,}$/.test(fk) || !/^[a-z0-9-]{20,}$/.test(secret)) return { ok: false, why: "The keys are 20 or more letters, digits and dashes." };
  try {
    const f = ctx.fetch || globalThis.fetch.bind(globalThis);
    const r = await f(url + "?op=pull&fk=" + encodeURIComponent(fk) + "&since=0", { method: "GET" });
    const j = await r.json();
    if (!j || !j.ok) return { ok: false, why: "The server did not accept the family key." };
  } catch (e) { return { ok: false, why: "Could not reach the server. Check the address and the internet." }; }
  return { ok: true, device: { mode: "link", role: "parent", backendUrl: url, familyKey: fk, parentSecret: secret, kidIds: [] } };
}

/** Save the finished device record and hand over to the app. */
export function finish(ctx, device, names) {
  const kids = (ctx.config && ctx.config.kids) || ["e", "m"];
  const rec = Object.assign({}, device, { names: names || { e: "E", m: "M" } });
  if (rec.role === "parent") rec.kidIds = kids.slice();
  store.saveDevice(rec);
  if (typeof ctx.refresh === "function") ctx.refresh();
  else ctx.device = rec;
  ctx.kid = rec.role === "kid" && rec.kidIds.length === 1 ? rec.kidIds[0] : undefined;
  if (typeof ctx.go === "function") return ctx.go(rec.mode === "link" && rec.role === "parent" ? "parent-board" : "who");
}

// ---------------- screens ----------------

function page(root, title, sub) {
  clear(root);
  const sec = h("section", { class: "card setup", "data-setup": "" }, h("h1", null, title));
  if (sub) sec.append(h("p", { class: "muted" }, sub));
  const msg = h("p", { class: "pmsg", role: "status", "data-msg": "" });
  sec.say = (t) => { msg.textContent = t || ""; };
  root.append(sec);
  sec.done = () => sec.append(msg);
  return sec;
}

function namesStep(root, ctx, device) {
  const sec = page(root, "Kid initials", "Use one letter for each kid. No full names.");
  const e = h("input", { class: "initial-input", "data-initial": "e", maxlength: "1", value: "E", "aria-label": "First kid initial", autocomplete: "off" });
  const m = h("input", { class: "initial-input", "data-initial": "m", maxlength: "1", value: "M", "aria-label": "Second kid initial", autocomplete: "off" });
  sec.append(h("div", { class: "btn-row" }, e, m));
  const names = () => ({ e: cleanInitial(e.value, "E"), m: cleanInitial(m.value, "M") });
  if (device.role === "kid") {
    sec.append(h("p", null, "Whose device is this?"));
    const row = h("div", { class: "btn-row" });
    for (const k of (ctx.config && ctx.config.kids) || ["e", "m"]) {
      row.append(h("button", { type: "button", class: "btn-primary", "data-pick-kid": k,
        onclick: () => finish(ctx, Object.assign({}, device, { kidIds: [k] }), names()) }, "Kid " + k.toUpperCase()));
    }
    sec.append(row);
  } else {
    sec.append(h("button", { type: "button", class: "btn-primary", "data-names-done": "", onclick: () => finish(ctx, device, names()) }, "Done"));
  }
  sec.done();
}

async function scanInto(sec, input, onText) {
  const BD = globalThis.BarcodeDetector;
  if (!BD || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    sec.say("This device cannot scan here. Type the code shown under the QR instead.");
    return;
  }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); }
  catch (e) { sec.say("The camera is not available. Type the code instead."); return; }
  const video = h("video", { class: "scan-video", playsinline: "", muted: "" });
  video.srcObject = stream;
  sec.append(video);
  await video.play().catch(() => {});
  const det = new BD({ formats: ["qr_code"] });
  const stop = () => { stream.getTracks().forEach((t) => t.stop()); video.remove(); };
  const started = Date.now();
  const tick = async () => {
    if (Date.now() - started > 60000) { stop(); sec.say("No code found. Try again or type it."); return; }
    try {
      const found = await det.detect(video);
      if (found && found[0] && found[0].rawValue) { stop(); input.value = found[0].rawValue; onText(found[0].rawValue); return; }
    } catch (e) { /* keep looking */ }
    setTimeout(tick, 300);
  };
  tick();
}

function joinStep(root, ctx) {
  const sec = page(root, "Join with a code", "On a parent phone open Parent mode, Devices, and add a device. Scan the QR or type its code.");
  const code = h("input", { class: "code-input", "data-code-input": "", autocomplete: "off", autocapitalize: "characters",
    "aria-label": "Pairing code", placeholder: "Code from the parent phone" });
  let busy = false;
  const join = async (text) => {
    if (busy) return;
    const t = String(text || "").trim();
    if (!t) { sec.say("Scan the QR or type the code."); return; }
    if (!t.startsWith("hbq1|")) { sec.say("Scan the QR on the parent phone. The typed code also needs the server line under it."); return; }
    busy = true;
    sec.say("Checking...");
    const r = await claim(ctx, t);
    busy = false;
    if (!r.ok) { sec.say(r.why); return; }
    namesStep(root, ctx, r.device);
  };
  sec.append(code, h("div", { class: "btn-row" },
    h("button", { type: "button", class: "btn-primary", "data-join": "", onclick: () => join(code.value) }, "Join"),
    h("button", { type: "button", class: "btn-secondary", "data-scan": "", onclick: () => scanInto(sec, code, join) }, "Scan QR")),
    h("button", { type: "button", class: "btn-secondary", "data-first-parent": "", onclick: () => firstStep(root, ctx) }, "This is the first parent phone"),
    h("button", { type: "button", class: "btn-secondary", "data-back": "", onclick: () => mount(root, ctx) }, "Back"));
  sec.done();
}

function firstStep(root, ctx) {
  const sec = page(root, "First parent phone", "Type the three values from your backend setup sheet. They stay on this phone only.");
  const url = h("input", { "data-url": "", type: "url", autocomplete: "off", "aria-label": "Web app address", placeholder: "Web app address" });
  const fk = h("input", { "data-fk": "", type: "password", autocomplete: "off", "aria-label": "Family key", placeholder: "Family key" });
  const ps = h("input", { "data-ps": "", type: "password", autocomplete: "off", "aria-label": "Parent secret", placeholder: "Parent secret" });
  sec.append(url, fk, ps, h("div", { class: "btn-row" },
    h("button", { type: "button", class: "btn-primary", "data-connect": "", onclick: async () => {
      sec.say("Checking...");
      const r = await firstParent(ctx, url.value.trim(), fk.value.trim(), ps.value.trim());
      if (!r.ok) { sec.say(r.why); return; }
      namesStep(root, ctx, r.device);
    } }, "Connect"),
    h("button", { type: "button", class: "btn-secondary", "data-back": "", onclick: () => joinStep(root, ctx) }, "Back")));
  sec.done();
}

/** mount the setup wizard */
export function mount(root, ctx) {
  const sec = page(root, "Welcome to Home Base Quest", "How will this device be used?");
  sec.append(h("div", { class: "btn-stack" },
    h("button", { type: "button", class: "btn-primary", "data-mode": "local",
      onclick: () => namesStep(root, ctx, { mode: "local", role: "parent", kidIds: [] }) }, "Just this device (local only)"),
    h("button", { type: "button", class: "btn-primary", "data-mode": "link", onclick: () => joinStep(root, ctx) }, "Parent Link (phones and tablets together)")),
    h("p", { class: "muted" }, "Local only keeps everything on this device. Parent Link shares the run with parent phones."));
  sec.done();
}
