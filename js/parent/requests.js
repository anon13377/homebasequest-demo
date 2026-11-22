// Card W1-H. Requests: held tickets get Approve or Deny (with an optional reason); approved ones get Delivered.
// Writes buy.approve, buy.deny, buy.delivered events only.

import { h, gate, shell, act, kidLabel } from "./common.js";

export async function mount(root, ctx) {
  if (!(await gate(root, ctx))) return;
  return draw(root, ctx);
}

export function draw(root, ctx) {
  const body = shell(root, ctx, "parent-requests", "Requests");
  renderRequests(body, ctx, () => draw(root, ctx));
  return body;
}

const itemName = (ctx, id) => { const it = ctx.config.shop.find((x) => x.id === id); return it ? it.name : id; };

export function renderRequests(body, ctx, rerender) {
  const all = Object.values(ctx.state.tickets || {});
  const held = all.filter((t) => t.status === "held");
  const approved = all.filter((t) => t.status === "approved");
  if (!held.length && !approved.length) body.append(h("p", { class: "muted", "data-empty": "" }, "No requests right now."));
  for (const t of held) {
    const who = Object.keys(t.contrib || { [t.kid]: 1 }).map((k) => kidLabel(ctx, k)).join(" and ");
    const reason = h("input", { type: "text", maxlength: "80", class: "reason", "data-reason": "", "aria-label": "Reason (optional)", placeholder: "Reason (optional)" });
    const data = () => { const r = String(reason.value || "").trim(); return r ? { ticket: t.id, reason: r } : { ticket: t.id }; };
    body.append(h("section", { class: "card pcard kid-" + t.kid, "data-ticket": t.id, "data-kid": t.kid },
      h("h2", null, itemName(ctx, t.item)),
      h("p", { class: "muted" }, who + " . " + t.price + " tokens" + (t.team ? " (team buy)" : "")),
      reason,
      h("div", { class: "btn-row" },
        h("button", { type: "button", class: "btn-success", "data-approve": "", onclick: () => act(body, ctx, rerender, t.kid, "buy.approve", data(), "Approved.") }, "Approve"),
        h("button", { type: "button", class: "btn-danger", "data-deny": "", onclick: () => act(body, ctx, rerender, t.kid, "buy.deny", data(), "Denied. Tokens returned.") }, "Deny"))));
  }
  if (approved.length) body.append(h("h2", null, "Approved, not delivered yet"));
  for (const t of approved) {
    body.append(h("section", { class: "card pcard kid-" + t.kid, "data-ticket": t.id, "data-kid": t.kid },
      h("h2", null, itemName(ctx, t.item)),
      h("p", { class: "muted" }, kidLabel(ctx, t.kid) + " . " + t.price + " tokens"),
      h("button", { type: "button", class: "btn-primary", "data-delivered": "", onclick: () => act(body, ctx, rerender, t.kid, "buy.delivered", { ticket: t.id }, "Marked delivered.") }, "Delivered")));
  }
}
