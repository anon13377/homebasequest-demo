// rules.js (card W1-B): pure reducer for Home Base Quest.
// No DOM, no Date.now, no storage. Every number comes from the config passed in.
// Shapes: CONTRACTS_v1 section 3 plus SCOPE_v2_ADDENDUM (photo proof).
// Additive Kid fields: spent, adjustments, streakPrev, crates. Ticket adds day and contrib.

import { addDays, at, isSchoolDay, weekStart, weekKey, parseDay } from "./clock.js";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const KID_TYPES = ["run.start", "step.done", "hw.set", "buy.request", "crate.open"];
// SCOPE 3: only the two missions (Zone Mission, Room Reset) land on Verified for a pay on verified kid.
// Homework, Reading and Land pay on Self for both kids. config.checkSteps overrides this default when present.
const MISSION_STEPS = ["zone", "reset"];
const payOnFor = (kidId, step, config) =>
  (config.checkSteps || MISSION_STEPS).includes(step) ? config.payOn[kidId] : "self";
const PARENT_TYPES = ["check.pass", "check.fix", "buy.approve", "buy.deny", "buy.delivered", "adjust", "bonus.team", "day.off", "config.set"];

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

function validDay(d) {
  if (typeof d !== "string" || !DAY_RE.test(d)) return false;
  try { parseDay(d); return true; } catch (e) { return false; }
}

/** Sort: events with seq first by seq, then the rest by t, then id. Repeated ids keep the first. */
function ordered(events) {
  const list = (Array.isArray(events) ? events : []).filter((e) => e && typeof e === "object" && typeof e.id === "string");
  const num = (x) => (typeof x === "number" && isFinite(x) ? x : null);
  list.sort((a, b) => {
    const sa = num(a.seq), sb = num(b.seq);
    if (sa !== null && sb !== null && sa !== sb) return sa - sb;
    if (sa !== null && sb === null) return -1;
    if (sa === null && sb !== null) return 1;
    const ta = num(a.t) || 0, tb = num(b.t) || 0;
    if (ta !== tb) return ta - tb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const seen = new Set();
  return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

function setPath(obj, path, value) {
  if (typeof path !== "string" || !path) return false;
  const parts = path.split(".");
  if (parts.some((p) => !p || p === "__proto__" || p === "constructor" || p === "prototype")) return false;
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!o || typeof o[parts[i]] !== "object" || o[parts[i]] === null) return false;
    o = o[parts[i]];
  }
  o[parts[parts.length - 1]] = clone(value);
  return true;
}

function shopItem(config, id) {
  return (config.shop || []).find((i) => i.id === id) || null;
}

function contribOf(ticket, kid) {
  return (ticket.contrib && ticket.contrib[kid]) || 0;
}

/** -> int tokens. E pays on self, M pays on verified (config.payOn). A pay on self kid is also paid if a step jumps to verified. */
export function stepPays(kidId, step, status, config) {
  const on = payOnFor(kidId, step, config);
  const amt = config.tokens[step] || 0;
  if (status === on) return amt;
  if (on === "self" && status === "verified") return amt;
  return 0;
}

/** -> { ok, why }. why: "unknown" | "limit" | "open" | "balance". Order matters: limit before open. */
export function canBuy(state, kid, item, config, day) {
  const it = shopItem(config, item);
  const k = state && state.kids && state.kids[kid];
  if (!it || !k) return { ok: false, why: "unknown" };
  const tickets = Object.values(state.tickets || {}).filter((t) => t.item === item && (t.kid === kid || contribOf(t, kid) > 0));
  if (it.limit && it.limit.per) {
    const same = (d) => (it.limit.per === "day" ? d === day : weekStart(d) === weekStart(day));
    const used = tickets.filter((t) => t.status !== "denied" && same(t.day)).length;
    if (used >= it.limit.count) return { ok: false, why: "limit" };
  }
  if (tickets.some((t) => t.status === "held")) return { ok: false, why: "open" };
  if (k.balance < it.price) return { ok: false, why: "balance" };
  return { ok: true, why: "" };
}

function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** -> { kind: "tokens" | "unlock", value }. Seeded by kid and week: same input, same output. */
export function crateRoll(kid, week, config) {
  const r = rng(hash32("crate|" + kid + "|" + week));
  const c = config.crate;
  if (r() < c.unlockChance) return { kind: "unlock", value: "crate-" + week };
  return { kind: "tokens", value: c.tokensMin + Math.floor(r() * (c.tokensMax - c.tokensMin + 1)) };
}

/** reduce(events, config) -> State */
export function reduce(events, config) {
  const cfg = clone(config);
  const kidIds = cfg.kids;
  const state = { kids: {}, jar: { marbles: 0, goal: cfg.jar.goal }, tickets: {}, flags: [] };
  for (const k of kidIds) {
    state.kids[k] = { balance: 0, held: 0, lifetime: 0, spent: 0, adjustments: 0, streak: 0, streakPrev: 0, shields: 0, unlocks: [], crates: [], days: {}, ledger: [] };
  }
  // Internal bookkeeping, kept out of the returned state.
  const runDay = {}, paid = new Set(), doneT = {}, hwNone = new Set(), off = new Set();
  const bonusPaid = new Set(), failWeeks = {}, flagged = new Set();
  let asOf = null;

  const isKid = (k) => kidIds.includes(k);
  const isOff = (k, d) => off.has(k + "|" + d);
  const ensureDay = (k, d) => {
    const days = state.kids[k].days;
    if (!days[d]) {
      const steps = {};
      for (const s of cfg.steps) steps[s] = "todo";
      days[d] = { started: false, order: null, steps, earned: 0, full: false, off: isOff(k, d) };
    }
    return days[d];
  };
  const complete = (k, step, status) => status === "verified" || (payOnFor(k, step, cfg) === "self" && status === "self");

  function earn(k, day, tokens, why, seq, daily) {
    const kid = state.kids[k];
    let amt = Math.max(0, Math.floor(tokens));
    if (daily) {
      const d = ensureDay(k, day);
      amt = Math.min(amt, Math.max(0, cfg.dailyMax - d.earned));
      d.earned += amt;
    }
    if (amt <= 0) return;
    kid.balance += amt;
    kid.lifetime += amt;
    state.jar.marbles += amt;
    kid.ledger.push({ seq, day, tokens: amt, why });
  }

  function perfect(k, ws) {
    let full = 0;
    for (let i = 0; i < 7; i++) {
      const x = addDays(ws, i);
      if (!isSchoolDay(x, cfg)) continue;
      const d = state.kids[k].days[x];
      if (d && d.full) full++;
      else if (!isOff(k, x)) return false;
    }
    return full > 0;
  }

  function weekCheck(k, day, seq) {
    const ws = weekStart(day);
    if (perfect(k, ws) && !bonusPaid.has("pw|" + k + "|" + ws)) {
      bonusPaid.add("pw|" + k + "|" + ws);
      earn(k, day, cfg.tokens.perfectWeek, "perfect week", seq, false);
    }
    if (!bonusPaid.has("tw|" + ws) && kidIds.length > 1 && kidIds.every((x) => perfect(x, ws))) {
      bonusPaid.add("tw|" + ws);
      for (const x of kidIds) earn(x, day, cfg.tokens.teamWeek, "team week", seq, false);
    }
  }

  function checkComplete(k, d, seq) {
    const day = state.kids[k].days[d];
    if (!cfg.steps.every((s) => complete(k, s, day.steps[s]))) return;
    day.full = true;
    if (!bonusPaid.has("rc|" + k + "|" + d)) {
      bonusPaid.add("rc|" + k + "|" + d);
      const last = Math.max(...cfg.steps.map((s) => doneT[k + "|" + d + "|" + s] || 0));
      if (last < at(d, cfg.times.dinnerCutoff)) earn(k, d, cfg.tokens.runComplete, "run complete", seq, true);
    }
    weekCheck(k, d, seq);
  }

  function payStep(k, d, step, status, seq) {
    const key = k + "|" + d + "|" + step;
    if (paid.has(key)) return;
    const amt = stepPays(k, step, status, cfg);
    if (amt > 0 || complete(k, step, status)) paid.add(key);
    if (amt > 0) earn(k, d, amt, "step " + step, seq, true);
  }

  // A kid event belongs to the open run: a run started yesterday and not full keeps today's steps (crosses midnight).
  function stepDay(k, ev) {
    const r = runDay[k];
    if (!r) return ev.day;
    if (ev.day === r) return r;
    const rd = state.kids[k].days[r];
    const today = state.kids[k].days[ev.day];
    if (ev.day === addDays(r, 1) && rd && !rd.full && !(today && today.started)) return r;
    return ev.day;
  }

  function findCheckDay(k, step, data) {
    if (data && validDay(data.day)) return state.kids[k].days[data.day] ? data.day : null;
    const keys = Object.keys(state.kids[k].days).sort().reverse();
    return keys.find((x) => state.kids[k].days[x].steps[step] === "self") || null;
  }

  function noteFail(k, item, day) {
    const key = k + "|" + item;
    const set = (failWeeks[key] = failWeeks[key] || new Set());
    const ws = weekStart(day);
    set.add(ws);
    let run = 0;
    for (let w = ws; set.has(w); w = addDays(w, -7)) run++;
    if (run >= cfg.flagFailWeeks && !flagged.has(key)) {
      flagged.add(key);
      state.flags.push({ type: "fail-weeks", kid: k, item, weeks: run, day });
    }
  }

  const list = ordered(events);
  list.forEach((ev, i) => {
    if (!validDay(ev.day)) return;
    const type = ev.type;
    if (KID_TYPES.includes(type) && (ev.role !== "kid" || !isKid(ev.kid))) return;
    if (PARENT_TYPES.includes(type) && ev.role !== "parent") return;
    if (!KID_TYPES.includes(type) && !PARENT_TYPES.includes(type)) return; // unknown types kept, ignored
    if (asOf === null || ev.day > asOf) asOf = ev.day;
    const seq = typeof ev.seq === "number" ? ev.seq : i;
    const data = ev.data && typeof ev.data === "object" ? ev.data : {};
    const k = ev.kid;
    const t = typeof ev.t === "number" ? ev.t : 0;

    switch (type) {
      case "run.start": {
        const day = ensureDay(k, ev.day);
        if (day.started) return;
        day.started = true;
        day.order = cfg.orders.includes(data.order) ? data.order : null;
        runDay[k] = ev.day;
        if (t < at(ev.day, cfg.times.start)) earn(k, ev.day, cfg.tokens.selfStart, "self start", seq, true);
        return;
      }
      case "hw.set": {
        const d = stepDay(k, ev);
        ensureDay(k, d);
        if (data.none === true) hwNone.add(k + "|" + d);
        else hwNone.delete(k + "|" + d);
        return;
      }
      case "step.done": {
        const step = data.step;
        if (!cfg.steps.includes(step)) return;
        const d = stepDay(k, ev);
        const day = ensureDay(k, d);
        const needsPhoto = cfg.photoSteps.includes(step) && !(step === "hw" && hwNone.has(k + "|" + d));
        if (needsPhoto && !data.photo) return; // addendum: no photo, step stays where it was
        if (day.steps[step] === "verified") return;
        day.steps[step] = "self";
        doneT[k + "|" + d + "|" + step] = t;
        payStep(k, d, step, "self", seq);
        checkComplete(k, d, seq);
        return;
      }
      case "check.pass":
      case "check.fix": {
        if (!isKid(k) || !cfg.steps.includes(data.step)) return;
        const d = findCheckDay(k, data.step, data);
        if (!d) return;
        const day = state.kids[k].days[d];
        if (day.steps[data.step] !== "self") return;
        if (type === "check.pass") {
          day.steps[data.step] = "verified";
          payStep(k, d, data.step, "verified", seq);
          checkComplete(k, d, seq);
        } else {
          day.steps[data.step] = "fix";
          const items = Array.isArray(data.items) && data.items.length ? data.items : [data.step];
          for (const it of items) if (typeof it === "string") noteFail(k, it, d);
        }
        return;
      }
      case "buy.request": {
        const tid = data.ticket, it = shopItem(cfg, data.item);
        const refuse = (why) => state.flags.push({ type: "refused", kid: k, ticket: typeof tid === "string" ? tid : null, why, day: ev.day });
        if (typeof tid !== "string" || !tid) return refuse("ticket");
        if (!it) return refuse("unknown");
        const kid = state.kids[k];
        const existing = state.tickets[tid];
        if (data.team === true) {
          if (!it.team) return refuse("team");
          const c = Math.floor(Number(data.price));
          if (!(c > 0)) return refuse("price");
          if (existing && (!existing.team || existing.item !== it.id || existing.status !== "held" || contribOf(existing, k) > 0)) return refuse("open");
          const sum = existing ? Object.values(existing.contrib).reduce((a, b) => a + b, 0) : 0;
          if (sum + c > it.price) return refuse("price");
          if (!existing) {
            const r = canBuy(state, k, it.id, cfg, ev.day);
            if (!r.ok && r.why !== "balance") return refuse(r.why);
          }
          if (kid.balance < c) return refuse("balance");
          kid.balance -= c;
          kid.held += c;
          kid.ledger.push({ seq, day: ev.day, tokens: -c, why: "hold " + it.id });
          if (existing) existing.contrib[k] = c;
          else state.tickets[tid] = { id: tid, kid: k, item: it.id, price: it.price, team: true, status: "held", day: ev.day, contrib: { [k]: c } };
          return;
        }
        if (existing) return refuse("open");
        if (Number(data.price) !== it.price) return refuse("price");
        const r = canBuy(state, k, it.id, cfg, ev.day);
        if (!r.ok) return refuse(r.why);
        kid.balance -= it.price;
        kid.held += it.price;
        kid.ledger.push({ seq, day: ev.day, tokens: -it.price, why: "hold " + it.id });
        state.tickets[tid] = { id: tid, kid: k, item: it.id, price: it.price, team: false, status: "held", day: ev.day, contrib: { [k]: it.price } };
        return;
      }
      case "buy.approve":
      case "buy.deny":
      case "buy.delivered": {
        const tk = state.tickets[data.ticket];
        if (!tk) return;
        if (type === "buy.delivered") {
          if (tk.status === "approved") tk.status = "delivered";
          return;
        }
        if (tk.status !== "held") return;
        tk.status = type === "buy.approve" ? "approved" : "denied";
        if (typeof data.reason === "string" && data.reason.trim()) tk.reason = data.reason.trim();
        for (const [who, c] of Object.entries(tk.contrib)) {
          const kid = state.kids[who];
          kid.held -= c;
          if (type === "buy.approve") kid.spent += c;
          else {
            kid.balance += c;
            kid.ledger.push({ seq, day: ev.day, tokens: c, why: "returned " + tk.item });
          }
        }
        return;
      }
      case "adjust": {
        if (!isKid(k)) return;
        const n = Number(data.tokens);
        const reason = typeof data.reason === "string" ? data.reason.trim() : "";
        if (!Number.isInteger(n) || n === 0 || !reason) return;
        const kid = state.kids[k];
        const applied = n > 0 ? n : -Math.min(kid.balance, -n);
        kid.balance += applied;
        kid.adjustments += applied;
        kid.ledger.push({ seq, day: ev.day, tokens: applied, why: "adjust: " + reason });
        return;
      }
      case "bonus.team": {
        if (data.key !== "kitchen-closed") return;
        const key = "kc|" + ev.day;
        if (bonusPaid.has(key)) return;
        bonusPaid.add(key);
        for (const x of kidIds) earn(x, ev.day, cfg.tokens.kitchenClosed, "kitchen closed", seq, false);
        return;
      }
      case "day.off": {
        const d = validDay(data.day) ? data.day : ev.day;
        const who = isKid(k) ? [k] : kidIds;
        for (const x of who) {
          off.add(x + "|" + d);
          if (state.kids[x].days[d]) state.kids[x].days[d].off = true;
        }
        for (const x of who) weekCheck(x, d, seq);
        return;
      }
      case "config.set": {
        setPath(cfg, data.path, data.value);
        state.jar.goal = cfg.jar.goal;
        return;
      }
      case "crate.open": {
        const week = data.week;
        const kid = state.kids[k];
        if (typeof week !== "string" || kid.crates.includes(week)) return;
        const full = Object.keys(kid.days).filter((x) => kid.days[x].full && weekKey(x) === week).sort();
        if (full.length < cfg.crate.minFullRuns) return;
        const crateDay = addDays(weekStart(full[0]), (cfg.crate.day + 6) % 7);
        if (ev.day < crateDay) return;
        kid.crates.push(week);
        const roll = crateRoll(k, week, cfg);
        if (roll.kind === "tokens") earn(k, ev.day, roll.value, "crate " + week, seq, false);
        else kid.unlocks.push(roll.value);
        return;
      }
    }
  });

  // Power Streak, shields and earned unlocks, walked over calendar school days up to the newest event day.
  // The newest day counts if full; if it has a run that is not full the streak shows 0 and streakPrev keeps the carry.
  for (const k of kidIds) {
    const kid = state.kids[k];
    const keys = Object.keys(kid.days).sort();
    let streak = 0, shields = 0, best = 0, prev = 0;
    if (keys.length && asOf) {
      for (let x = keys[0]; x <= asOf; x = addDays(x, 1)) {
        if (!isSchoolDay(x, cfg) || isOff(k, x)) continue;
        const d = kid.days[x];
        if (d && d.full) {
          streak++;
          best = Math.max(best, streak);
          if (streak % cfg.streak.shieldEvery === 0) shields++;
        } else if (x === asOf) {
          if (d) { prev = streak; streak = 0; }
        } else if (shields > 0) {
          shields--;
        } else {
          streak = 0;
        }
      }
    }
    kid.streak = streak;
    kid.streakPrev = d0(prev, streak);
    kid.shields = shields;
    const crateUnlocks = kid.unlocks.slice();
    kid.unlocks = [
      ...cfg.streak.unlockAt.filter((n) => best >= n).map((n) => "streak-" + n),
      ...(cfg.streak.lifetimeUnlockAt || []).filter((n) => kid.lifetime >= n).map((n) => "life-" + n),
      ...crateUnlocks,
    ];
  }
  return state;
}

function d0(prev, streak) {
  return streak > 0 ? streak : prev;
}
