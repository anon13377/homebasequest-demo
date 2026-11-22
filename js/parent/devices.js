// Card W1-H. Devices and pairing. A parent device asks the server for a one time code (POST pair with the parent
// secret in the body, valid 10 minutes); the new device claims it once. The code and QR exist only on this screen,
// only after the PIN, and are dropped on any redraw or lock. Any number of parent or kid devices can be added.
// QR text: hbq1|<backend url>|<family key>|<code>|<role>   (parsePairText reads it back for the setup card).

import { h, clear, gate, shell } from "./common.js";
import qrcode from "../../vendor/qrcode.mjs";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-devices", "Devices");
  renderDevices(body, ctx);
  return body;
}

export const pairText = (url, fk, code, role) => ["hbq1", url, fk, code, role].join("|");
export function parsePairText(text) {
  const p = String(text || "").split("|");
  if (p.length !== 5 || p[0] !== "hbq1" || !/^[A-Z0-9]{10}$/.test(p[3]) || !["parent", "kid"].includes(p[4])) return null;
  return { url: p[1], fk: p[2], code: p[3], role: p[4] };
}

/** SVG QR (one path) when the platform can make SVG; the readable code is always shown as well. */
export function qrNode(text) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + (c + 4) + " " + (r + 4) + "h1v1h-1z";
  const ns = "http://www.w3.org/2000/svg";
  if (typeof document.createElementNS !== "function") return h("div", { class: "qr", "data-qr": "", "data-modules": String(n) });
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 " + (n + 8) + " " + (n + 8));
  svg.setAttribute("class", "qr");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Pairing QR code");
  svg.setAttribute("data-qr", "");
  svg.setAttribute("data-modules", String(n));
  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", String(n + 8)); bg.setAttribute("height", String(n + 8)); bg.setAttribute("fill", "#fff");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d); path.setAttribute("fill", "#000");
  svg.append(bg, path);
  return svg;
}

export function renderDevices(body, ctx) {
  const d = ctx.device || {};
  const out = h("div", { class: "pair-out", "data-pair-out": "" });
  const local = !(d.backendUrl && d.familyKey && d.parentSecret);
  async function pair(role, kid) {
    clear(out);
    if (local && !ctx.demo) { body.say("Pairing needs Parent Link. This device is in local only mode."); return; }
    let code, expires;
    if (ctx.demo && local) { code = "DEMOCODE00"; expires = Date.now() + 600000; }
    else {
      try {
        const f = ctx.fetch || globalThis.fetch.bind(globalThis);
        const res = await f(d.backendUrl, { method: "POST", headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ op: "pair", fk: d.familyKey, parentSecret: d.parentSecret, role, kid }) });
        const j = await res.json();
        if (!j || !j.ok) { body.say("The server did not give a code. This device may not be a parent device."); return; }
        code = j.code; expires = j.expires;
      } catch (e) { body.say("Could not reach the server. Try again."); return; }
    }
    body.say("");
    const mins = Math.max(1, Math.round((expires - Date.now()) / 60000));
    out.append(h("section", { class: "card", "data-pair": role },
      h("h2", null, role === "parent" ? "New parent device" : "New kid device"),
      h("p", { class: "muted" }, "Open the app on the new device and scan this, or type the code. It works once and expires in about " + mins + " minutes."),
      qrNode(pairText(d.backendUrl || "demo", d.familyKey || "demo", code, role)),
      h("p", { class: "pair-code num", "data-code": "" }, code),
      h("p", { class: "muted" }, "iPhone or iPad: send the pairing text by AirDrop, then paste it on the new device under Join with a code."),
      h("div", { class: "btn-row" },
        h("button", { type: "button", class: "btn-secondary", "data-copy-pair": "", onclick: async (ev) => {
          const t = pairText(d.backendUrl || "demo", d.familyKey || "demo", code, role);
          try { await navigator.clipboard.writeText(t); ev.target.textContent = "Copied"; } catch (e) { ev.target.textContent = "Copy failed"; }
        } }, "Copy pairing text"),
        typeof navigator !== "undefined" && navigator.share ? h("button", { type: "button", class: "btn-secondary", "data-share-pair": "", onclick: () => {
          navigator.share({ text: pairText(d.backendUrl || "demo", d.familyKey || "demo", code, role) }).catch(() => {});
        } }, "Send pairing text") : null),
      h("button", { type: "button", class: "btn-secondary", "data-hide": "", onclick: () => clear(out) }, "Hide")));
  }
  body.append(h("section", { class: "card", "data-editor": "devices" },
    h("h2", null, "Add a device"),
    h("p", { class: "muted" }, "Each kid has their own device. You can add as many parent phones as you like."),
    h("div", { class: "btn-row" },
      h("button", { type: "button", class: "btn-primary", "data-pair-btn": "parent", onclick: () => pair("parent") }, "Add a parent device"),
      ...((ctx.config && ctx.config.kids) || []).map((k) => h("button", { type: "button", class: "btn-primary", "data-pair-btn": "kid", "data-kid": k,
        onclick: () => pair("kid", k) }, "Add a kid device for " + ((d.names && d.names[k]) || k.toUpperCase()))))),
    out);
}
