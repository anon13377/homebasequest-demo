// Card W1-E. Kid screen "history": every token movement, newest first, in plain words. Parent adjustments show their reason.

import { h, clear, kidState } from "./today.js";
import { header, itemName } from "./shop.js";

/** Plain words for a ledger line. Unknown text is shown as is (as text, never markup). */
export function whyText(config, why) {
  const w = String(why || "");
  if (w.startsWith("adjust: ")) return "Dad changed your tokens: " + w.slice(8);
  if (w.startsWith("hold ")) return "Held for " + itemName(config, w.slice(5));
  if (w.startsWith("returned ")) return "Tokens back from " + itemName(config, w.slice(9));
  if (w.startsWith("step ")) return "Finished " + w.slice(5);
  if (w.startsWith("crate ")) return "Crate reward";
  const map = { "self start": "Started on time", "run complete": "Run complete", "perfect week": "Perfect week", "team week": "Team week", "kitchen closed": "Kitchen closed bonus" };
  return map[w] || w;
}

export function mount(root, ctx) {
  clear(root);
  const k = kidState(ctx);
  const wrap = h("div", { class: "shop history kid-" + ctx.kid, "data-kid": ctx.kid });
  wrap.append(header(root, ctx, "History"));
  wrap.append(h("section", { class: "card history-sum", "data-summary": "" },
    h("p", null, "Earned in all: " + k.lifetime),
    h("p", null, "Spent on rewards: " + (k.spent || 0)),
    h("p", null, "Streak: " + k.streak)));
  const lines = (k.ledger || []).slice().reverse();
  if (!lines.length) {
    wrap.append(h("section", { class: "card" }, h("p", { class: "muted" }, "Nothing yet. Finish a step to earn your first tokens.")));
  } else {
    const ul = h("ul", { class: "ledger" });
    for (const l of lines) {
      const plus = l.tokens > 0;
      ul.append(h("li", { class: "ledger-line " + (plus ? "plus" : "minus"), "data-tokens": String(l.tokens), "data-day": l.day },
        h("span", { class: "ledger-day" }, l.day),
        h("span", { class: "ledger-why" }, whyText(ctx.config, l.why)),
        h("span", { class: "ledger-amt" }, (plus ? "+" : "") + l.tokens)));
    }
    wrap.append(ul);
  }
  root.append(wrap);
}
