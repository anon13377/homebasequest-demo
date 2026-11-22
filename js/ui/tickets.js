// Card W1-E. Kid screen "tickets": open and finished reward tickets for this kid (including team buys they chipped in on).

import { h, clear, nav } from "./today.js";
import { header, itemName } from "./shop.js";

export const STATUS_TEXT = {
  held: "Waiting for Dad",
  approved: "Approved. Waiting for the reward",
  denied: "Not now. Your tokens came back",
  delivered: "Delivered",
};

function mine(ctx) {
  return Object.values(ctx.state.tickets || {}).filter((t) => t.kid === ctx.kid || ((t.contrib && t.contrib[ctx.kid]) || 0) > 0);
}

function card(ctx, t) {
  const put = (t.contrib && t.contrib[ctx.kid]) || 0;
  const sum = Object.values(t.contrib || {}).reduce((a, b) => a + b, 0);
  return h("li", { class: "card ticket " + t.status, "data-ticket": t.id, "data-status": t.status },
    h("div", { class: "shop-row" },
      h("h2", { class: "shop-name" }, itemName(ctx.config, t.item)),
      h("span", { class: "coin-chip" }, String(t.price))),
    h("p", { class: "ticket-status", "data-state": "" }, STATUS_TEXT[t.status] || t.status),
    t.team ? h("p", { class: "muted" }, "Team buy. You put in " + put + ". Together " + sum + " of " + t.price + ".") : null,
    t.status === "denied" && t.reason ? h("p", { class: "muted", "data-reason": "" }, "Dad says: " + t.reason) : null);
}

export function mount(root, ctx) {
  clear(root);
  const wrap = h("div", { class: "shop tickets kid-" + ctx.kid, "data-kid": ctx.kid });
  wrap.append(header(root, ctx, "My tickets"));
  const all = mine(ctx);
  const open = all.filter((t) => t.status === "held" || t.status === "approved");
  const done = all.filter((t) => t.status === "delivered" || t.status === "denied");
  if (!all.length) {
    wrap.append(h("section", { class: "card" }, h("p", { class: "muted" }, "No tickets yet. Visit the shop when you have tokens.")));
  }
  if (open.length) {
    wrap.append(h("h2", { class: "shop-sub" }, "Open"));
    const ul = h("ul", { class: "shop-list", "data-list": "open" });
    for (const t of open) ul.append(card(ctx, t));
    wrap.append(ul);
  }
  if (done.length) {
    wrap.append(h("h2", { class: "shop-sub" }, "Finished"));
    const ul = h("ul", { class: "shop-list", "data-list": "done" });
    for (const t of done) ul.append(card(ctx, t));
    wrap.append(ul);
  }
  wrap.append(h("button", { type: "button", class: "btn-secondary", "data-go": "shop", onclick: () => nav(root, ctx, "shop") }, "Back to the shop"));
  root.append(wrap);
}
