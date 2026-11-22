// Card W1-D. Kid screen "who". Each kid has their own device (SCOPE v2 answer 3), so a device paired to one
// kid opens straight to that kid's run. The picker shows only on a device with no pairing or with several kids
// (local demo mode).

import { h, clear, nav } from "./today.js";

/** The one kid this device is paired to, or null. */
export function pairedKid(device, config) {
  const ids = ((device && device.kidIds) || []).filter((k) => config.kids.includes(k));
  return ids.length === 1 ? ids[0] : null;
}

export function mount(root, ctx) {
  const one = pairedKid(ctx.device, ctx.config);
  if (one) {
    ctx.kid = one;
    return nav(root, ctx, "today", { kid: one });
  }
  const ids = ((ctx.device && ctx.device.kidIds) || []).filter((k) => ctx.config.kids.includes(k));
  const kids = ids.length ? ids : ctx.config.kids;
  clear(root);
  const row = h("div", { class: "who-grid" });
  for (const k of kids) {
    const name = (ctx.device && ctx.device.names && ctx.device.names[k]) || k.toUpperCase();
    row.append(h("button", { type: "button", class: "who-btn kid-" + k, "data-kid": k, onclick: () => nav(root, ctx, "today", { kid: k }) },
      h("span", { class: "kid-dot " + k, "aria-hidden": "true" }), h("span", { class: "who-name" }, name)));
  }
  root.append(h("section", { class: "card who" }, h("h1", null, "Who is here?"), row));
}
