// Card W1-C. Reward Shop default shelf (SCOPE 5, addendum answer 6). Same ids and prices as config.shop.
// limit: { per: "day" | "week", count } or null. team: team buy allowed. parentSchedules: parent picks the time.

export const SHOP = [
  { id: "snack", name: "Sugary snack", price: 30, limit: { per: "week", count: 3 }, team: false },
  { id: "screen30", name: "30 more minutes of screen time", price: 40, limit: { per: "day", count: 1 }, team: false },
  { id: "dinner", name: "Pick tonight's dinner", price: 60, limit: { per: "week", count: 1 }, team: false },
  { id: "late30", name: "Stay up 30 minutes late (Fri or Sat)", price: 70, limit: { per: "week", count: 1 }, team: false },
  { id: "movie", name: "Movie night (you pick the movie)", price: 120, limit: null, team: true },
  { id: "big", name: "Big one: outing or sleepover", price: 300, limit: null, team: false, parentSchedules: true },
];

export default SHOP;
