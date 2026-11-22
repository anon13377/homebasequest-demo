// Home Base Quest config. Every number the app uses lives here (CONTRACTS section 3).
// Sources: SCOPE_v1.md sections 3 to 6 and SCOPE_v2_ADDENDUM.md (addendum wins).
// Parent editors change these through config.set events; this file is the default.

export const CONFIG = Object.freeze({
  version: "hbq-v1",

  // Backend. The real URL is entered on each device during setup and never committed.
  backend: {
    url: "https://backend.invalid/exec", // placeholder only, lint allows no other host
    pullEverySec: 60,
    photoMaxBytes: 400 * 1024,
  },

  kids: ["e", "m"],

  // Step order. Land first, then the kid picks hw-first or mission-first.
  steps: ["land", "hw", "read", "zone", "reset"],
  orders: ["hw-first", "mission-first"],

  // Tokens (SCOPE 3, TASKS golden numbers).
  tokens: {
    land: 0,
    hw: 5,
    read: 3,
    zone: 6,
    reset: 4,
    selfStart: 3,
    runComplete: 2,
    perfectWeek: 15,
    teamWeek: 10,
    kitchenClosed: 10,
  },
  dailyMax: 23,

  // E pays on Self (with photo where required), M pays on Verified (addendum answer 7).
  payOn: { e: "self", m: "verified" },
  // Only these steps wait for Verified under a "verified" payOn; the rest pay on Self (golden S4).
  checkSteps: ["zone", "reset"],

  // Photo Proof (addendum). These steps need one photo to reach Self.
  photoSteps: ["zone", "reset", "hw"],
  photo: {
    longSide: 1024,
    targetBytes: 150 * 1024,
    maxBytes: 400 * 1024,
    jpegQuality: 0.8,
    keepDays: 14,
  },

  // Times, device local, 24 hour "HH:MM" (addendum answer 5).
  times: {
    start: "15:45",
    dinnerCutoff: "18:00",
    nudgeAfterMin: 30,
    digest: "19:00",
    sundaySummary: "18:00",
  },

  // Timers in minutes.
  timers: {
    reading: 20,
    brainTime: 15,
    missionCap: { e: 20, m: 15 },
  },

  homeworkSubjects: ["math", "reading-log", "spelling", "science", "other"],

  // School days: 1 = Monday ... 5 = Friday (JS getDay numbering, Sunday 0).
  schoolDays: [0, 1, 2, 3, 4, 5, 6], // DEMO: every day is a run day so the demo is playable on weekends

  // Power Streak and Base upgrades (SCOPE 4).
  streak: {
    shieldEvery: 10,
    unlockAt: [3, 5, 10, 20, 40],
    lifetimeUnlockAt: [100, 250, 500, 1000],
  },

  // Friday Crate (SCOPE 4).
  crate: {
    minFullRuns: 4,
    tokensMin: 5,
    tokensMax: 15,
    unlockChance: 0.3,
    day: 5,
  },

  // Family Jar (SCOPE 4).
  jar: { goal: 1000 },

  // Repeated fail flag (SCOPE 3): same item failing this many weeks in a row.
  flagFailWeeks: 3,

  // Reward Shop default shelf (SCOPE 5, addendum answer 6).
  // limit: { per: "day" | "week" | null, count } ; team: team buy allowed ; parentSchedules: big one.
  shop: [
    { id: "snack", name: "Sugary snack", price: 30, limit: { per: "week", count: 3 }, team: false },
    { id: "screen30", name: "30 more minutes of screen time", price: 40, limit: { per: "day", count: 1 }, team: false },
    { id: "dinner", name: "Pick tonight's dinner", price: 60, limit: { per: "week", count: 1 }, team: false },
    { id: "late30", name: "Stay up 30 minutes late (Fri or Sat)", price: 70, limit: { per: "week", count: 1 }, team: false },
    { id: "movie", name: "Movie night (you pick the movie)", price: 120, limit: null, team: true },
    { id: "big", name: "Big one: outing or sleepover", price: 300, limit: null, team: false, parentSchedules: true },
  ],

  // Pushes (SCOPE 6, addendum answers 2 and 4). Each can be switched off.
  pushes: {
    started: true,
    needsCheck: true,
    request: true,
    runComplete: true,
    notStarted: true,
    digest: true,
    sunday: true,
    emailSubjectPrefix: "[HBQ]",
  },

  // UI.
  ui: {
    minTouchPx: 56,
    narrowestPx: 360,
  },
});

export default CONFIG;
