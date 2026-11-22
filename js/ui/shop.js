// Card W1-E. Kid screen "shop": Reward Shop. Buying sends a buy.request event; the tokens move to On Hold
// inside rules.js, never here. Text only (no raw HTML sinks). Team buy: both kids chip in on one ticket.
// ctx contract: same as today.js ({ state, config, device, kid, day, go?, append?(ev), events?, demo }).

import { h, clear, emit, nav, kidState, dayKeyOf } from "./today.js";
import { canBuy } from "../rules.js";
import { newId } from "../store.js";

const WHY = {
  limit: "You already got this one for now. Try again later.",
  open: "You already have one waiting for Dad.",
  balance: (need) => "Not enough tokens yet. You need " + need + " more.",
  unknown: "This one is not on the shelf right now.",
};

export function limitText(it) {
  const bits = [];
  if (it.limit && it.limit.per) bits.push(it.limit.count + " per " + it.limit.per);
  if (it.team) bits.push("Team buy allowed");
  if (it.parentSchedules) bits.push("Dad picks the time");
  return bits.join(" · ");
}

/** Shared head of the three screens: back button, title, balance and on hold chips. */
export function header(root, ctx, title) {
  const k = kidState(ctx);
  return h("header", { class: "shop-head" },
    h("button", { type: "button", class: "back btn-secondary", "data-back": "", onclick: () => nav(root, ctx, "today") }, "Back to my run"),
    h("h1", null, title),
    h("div", { class: "run-stats" },
      h("span", { class: "coin-chip balance", "data-balance": "" }, k.balance + " tokens"),
      h("span", { class: "chip held", "data-held": "" }, k.held + " on hold")));
}

export function itemName(config, id) {
  const it = config.shop.find((x) => x.id === id);
  return it ? it.name : id;
}

function teamTicket(ctx, itemId) {
  return Object.values(ctx.state.tickets || {}).find((t) => t.team && t.item === itemId && t.status === "held") || null;
}

/** What the button for one item should do. */
function plan(ctx, it) {
  const kid = kidState(ctx);
  const day = dayKeyOf(ctx);
  if (it.team) {
    const open = teamTicket(ctx, it.id);
    if (open) {
      const mine = (open.contrib && open.contrib[ctx.kid]) || 0;
      const sum = Object.values(open.contrib || {}).reduce((a, b) => a + b, 0);
      if (mine > 0) return { label: "You put in " + mine, note: "Waiting for Dad", disabled: true, kind: "mine" };
      const left = it.price - sum;
      if (left <= 0) return { label: "Fully funded", note: "Waiting for Dad", disabled: true, kind: "full" };
      if (kid.balance < left) return { label: "Chip in " + left, why: WHY.balance(left - kid.balance), whyKey: "balance", disabled: true, kind: "chip" };
      return { label: "Chip in " + left, ticket: open.id, amount: left, kind: "chip" };
    }
    const r = canBuy(ctx.state, ctx.kid, it.id, ctx.config, day);
    const half = Math.floor(it.price / 2);
    if (!r.ok && r.why !== "balance") return { label: "Start team buy", why: WHY[r.why] || WHY.unknown, whyKey: r.why, disabled: true, kind: "start" };
    if (kid.balance < half) return { label: "Start team buy: put in " + half, why: WHY.balance(half - kid.balance), whyKey: "balance", disabled: true, kind: "start" };
    return { label: "Start team buy: put in " + half, ticket: newId(), amount: half, kind: "start" };
  }
  const r = canBuy(ctx.state, ctx.kid, it.id, ctx.config, day);
  if (!r.ok) {
    const why = r.why === "balance" ? WHY.balance(it.price - kid.balance) : WHY[r.why] || WHY.unknown;
    return { label: "Buy", why, whyKey: r.why, disabled: true, kind: "buy" };
  }
  return { label: "Buy", ticket: newId(), amount: it.price, kind: "buy" };
}

/** The demo fixture tickets have no day or contrib (the real reducer always sets both). Fill them so canBuy can run. */
function fixDemo(ctx) {
  for (const t of Object.values(ctx.state.tickets || {})) {
    if (!t.day) t.day = dayKeyOf(ctx);
    if (!t.contrib) t.contrib = { [t.kid]: t.price };
  }
}

export function mount(root, ctx) {
  if (ctx.demo) fixDemo(ctx);
  render(root, ctx, "");
}

function render(root, ctx, msg) {
  clear(root);
  const wrap = h("div", { class: "shop kid-" + ctx.kid, "data-kid": ctx.kid });
  wrap.append(header(root, ctx, "Reward Shop"));
  if (msg) wrap.append(h("p", { class: "shop-msg", role: "status", "data-msg": "" }, msg));
  const list = h("ul", { class: "shop-list" });
  for (const it of ctx.config.shop) {
    const p = plan(ctx, it);
    const btn = h("button", {
      type: "button", class: p.disabled ? "btn-secondary" : "btn-primary", "data-buy": it.id, "data-kind": p.kind,
      disabled: !!p.disabled,
      onclick: () => {
        emit(ctx, "buy.request", { ticket: p.ticket, item: it.id, price: p.amount, team: p.kind !== "buy" });
        render(root, ctx, p.kind === "buy" ? "Sent. Waiting for Dad." : "Your tokens are in. Waiting for Dad.");
      },
    }, p.label);
    list.append(h("li", { class: "card shop-item", "data-item": it.id },
      h("div", { class: "shop-row" },
        h("h2", { class: "shop-name" }, it.name),
        h("span", { class: "coin-chip" }, String(it.price))),
      limitText(it) ? h("p", { class: "muted shop-limit" }, limitText(it)) : null,
      btn,
      p.why ? h("p", { class: "shop-why", "data-why": p.whyKey || p.kind }, p.why) : null,
      p.note ? h("p", { class: "muted", "data-note": "" }, p.note) : null));
  }
  wrap.append(list);
  wrap.append(h("button", { type: "button", class: "btn-secondary", "data-go": "tickets", onclick: () => nav(root, ctx, "tickets") }, "My tickets"));
  root.append(wrap);
}
