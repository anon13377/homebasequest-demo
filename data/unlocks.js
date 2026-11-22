// Card W1-C. Base upgrades, earned and never bought (SCOPE 4.3). Thresholds match config.streak.
// Ids are the ones js/rules.js writes into kid.unlocks: "streak-N", "life-N", and "crate-<week>" (a crate cosmetic, one per week).
// Art and final names come from card W1-F; kind is one of: room theme, roof flag, pet, night sky.

export const UNLOCKS = [
  { id: "streak-3", via: "streak", at: 3, kind: "room theme", name: "Streak 3 room theme" },
  { id: "streak-5", via: "streak", at: 5, kind: "roof flag", name: "Streak 5 roof flag" },
  { id: "streak-10", via: "streak", at: 10, kind: "pet", name: "Streak 10 pet" },
  { id: "streak-20", via: "streak", at: 20, kind: "night sky", name: "Streak 20 night sky" },
  { id: "streak-40", via: "streak", at: 40, kind: "room theme", name: "Streak 40 room theme" },
  { id: "life-100", via: "lifetime", at: 100, kind: "room theme", name: "Lifetime 100 room theme" },
  { id: "life-250", via: "lifetime", at: 250, kind: "roof flag", name: "Lifetime 250 roof flag" },
  { id: "life-500", via: "lifetime", at: 500, kind: "pet", name: "Lifetime 500 pet" },
  { id: "life-1000", via: "lifetime", at: 1000, kind: "night sky", name: "Lifetime 1000 night sky" },
];

export const CRATE_UNLOCK_PREFIX = "crate-";

export default UNLOCKS;
