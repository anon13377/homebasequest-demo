// Card W1-C. Ported from HomeBaseHQ assets/data.js (read only). Generated once; edit through the parent editors or by hand.
// Task id = <day>-<step>-<kid>-<n>. step: zone (Zone Mission) or reset (Room Reset). kid: "e" or "m".
// Every note (safety line) lists the task ids it is attached to; each task lists its note ids.

export const DAYS = [
 {
  "id": "mon",
  "day": 1,
  "name": "Monday",
  "zone": "🚪 ENTRY",
  "room": "Garage Door + Front Door",
  "emoji": "🚪",
  "rule": "MICROFIBER AND THE ALL-PURPOSE SPRAY · BOTH DOORS, NOT JUST ONE",
  "dish": {
   "am": {
    "e": "top rack",
    "m": "bottom rack"
   },
   "pm": {
    "e": "bottom rack",
    "m": "top rack"
   }
  },
  "resetTitle": {
   "e": "E's room reset",
   "m": "💜 M ZONE A · Sleep and Totes"
  },
  "notes": [],
  "bonuses": []
 },
 {
  "id": "tue",
  "day": 2,
  "name": "Tuesday",
  "zone": "🚿 BATHROOMS",
  "room": "Both Bathrooms",
  "emoji": "🚿",
  "rule": "PICK UP AND PUT AWAY · NO CLEANERS, NO TOILETS, NO SINKS",
  "dish": {
   "am": {
    "e": "bottom rack",
    "m": "top rack"
   },
   "pm": {
    "e": "top rack",
    "m": "bottom rack"
   }
  },
  "resetTitle": {
   "e": "E's desk and dresser",
   "m": "💜 M's room quick reset"
  },
  "notes": [
   {
    "id": "tue-note-1",
    "type": "alert",
    "head": "Nobody is cleaning a toilet.",
    "body": "Not yet. Tuesday is pick up, put away, empty the trash, and sweep. That is the whole job.",
    "tasks": [
     "tue-zone-e-1",
     "tue-zone-e-2",
     "tue-zone-e-3",
     "tue-zone-e-4",
     "tue-zone-e-5",
     "tue-zone-m-1",
     "tue-zone-m-2",
     "tue-zone-m-3",
     "tue-zone-m-4",
     "tue-reset-e-1",
     "tue-reset-e-2",
     "tue-reset-e-3",
     "tue-reset-m-1",
     "tue-reset-m-2",
     "tue-reset-m-3",
     "tue-reset-m-4",
     "tue-reset-m-5"
    ]
   }
  ],
  "bonuses": []
 },
 {
  "id": "wed",
  "day": 3,
  "name": "Wednesday",
  "zone": "🛋️ LIVING ROOM",
  "room": "Living Room",
  "emoji": "🛋️",
  "rule": "DUST HIGH FIRST, THEN WIPE LOW · NOTHING TOUCHES THE TV SCREEN",
  "dish": {
   "am": {
    "e": "top rack",
    "m": "bottom rack"
   },
   "pm": {
    "e": "bottom rack",
    "m": "top rack"
   }
  },
  "resetTitle": {
   "e": "E's closet and drawers",
   "m": "💜 M ZONE B · Desk and Dresser"
  },
  "notes": [
   {
    "id": "wed-note-1",
    "type": "danger",
    "head": "Do not touch the TV screen.",
    "body": "No spray, no microfiber, no paper towel, nothing. The stand and the shelves get wiped. The screen does not.",
    "tasks": [
     "wed-zone-e-3",
     "wed-zone-e-5"
    ]
   },
   {
    "id": "wed-note-2",
    "type": "alert",
    "head": "This desk is the homework zone.",
    "body": "It has to start empty or homework has nowhere to go.",
    "tasks": [
     "wed-reset-m-1"
    ]
   }
  ],
  "bonuses": []
 },
 {
  "id": "thu",
  "day": 4,
  "name": "Thursday",
  "zone": "🧹 FLOORS + STAIRS",
  "room": "Every Floor In The House",
  "emoji": "🧹",
  "rule": "FLOORS ARE ALWAYS LAST · PICK EVERYTHING UP BEFORE ANYTHING ELSE",
  "dish": {
   "am": {
    "e": "bottom rack",
    "m": "top rack"
   },
   "pm": {
    "e": "top rack",
    "m": "bottom rack"
   }
  },
  "resetTitle": {
   "e": "🪜 The Stairs (broom and brush, no vacuum)",
   "m": "💜 M's room quick reset"
  },
  "notes": [
   {
    "id": "thu-note-1",
    "type": "danger",
    "head": "Never carry mop water between the kitchen and a bathroom.",
    "body": "Dump it, rinse the bucket, refill. Mopping a bathroom with kitchen water is worse than not mopping at all.",
    "tasks": [
     "thu-zone-e-3",
     "thu-zone-e-4",
     "thu-zone-e-5"
    ]
   },
   {
    "id": "thu-note-2",
    "type": "alert",
    "head": "There is no vacuum for the stairs.",
    "body": "Stairs get the broom and the dustpan brush, worked from the top step down. Same idea, same order, no vacuum.",
    "tasks": [
     "thu-reset-e-1",
     "thu-reset-e-2",
     "thu-reset-e-3",
     "thu-reset-e-4",
     "thu-reset-e-5"
    ]
   },
   {
    "id": "thu-note-3",
    "type": "danger",
    "head": "Nobody carries the vacuum up or down the stairs.",
    "body": "Pushing it around on a flat floor is fine. Carrying it between floors is not. Ask a grown-up to move it.",
    "tasks": [
     "thu-zone-e-1",
     "thu-zone-e-2",
     "thu-zone-m-1",
     "thu-zone-m-2",
     "thu-reset-e-1"
    ]
   }
  ],
  "bonuses": []
 },
 {
  "id": "fri",
  "day": 5,
  "name": "Friday",
  "zone": "🍳 KITCHEN",
  "room": "Kitchen · 3 Counters + The Island",
  "emoji": "🍳",
  "rule": "THE EASY DAY · WIPE DOWN, PICK UP, SWEEP, THEN TOTE DUMP",
  "dish": {
   "am": {
    "e": "top rack",
    "m": "bottom rack"
   },
   "pm": {
    "e": "bottom rack",
    "m": "top rack"
   }
  },
  "resetTitle": {
   "e": "Tote Dump support crew",
   "m": "💜 M ZONE C + 🎲 TOTE DUMP"
  },
  "notes": [
   {
    "id": "fri-note-1",
    "type": "alert",
    "head": "No stove, no convection oven, no sink.",
    "body": "Those are not kitchen jobs yet. Counters, the island, the table, the trash, and the floor. That is it.",
    "tasks": [
     "fri-zone-e-1",
     "fri-zone-e-2",
     "fri-zone-e-3",
     "fri-zone-e-4",
     "fri-zone-m-1",
     "fri-zone-m-2",
     "fri-zone-m-3",
     "fri-zone-m-4",
     "fri-reset-e-1",
     "fri-reset-e-2",
     "fri-reset-e-3",
     "fri-reset-m-1",
     "fri-reset-m-2",
     "fri-reset-m-3",
     "fri-reset-m-4",
     "fri-reset-m-5",
     "fri-reset-m-6",
     "fri-reset-m-7",
     "fri-reset-m-8",
     "fri-reset-m-9"
    ]
   }
  ],
  "bonuses": [
   {
    "id": "b1",
    "pts": 50,
    "kid": "team",
    "label": "🎲 Tote Dump done, sorted, and refilled"
   },
   {
    "id": "b2",
    "pts": 15,
    "kid": "team",
    "label": "⏱️ Beat the 15 minute timer"
   },
   {
    "id": "b4",
    "pts": 25,
    "kid": "team",
    "label": "🔒 Every lid in the room closes"
   },
   {
    "id": "b5",
    "pts": 50,
    "kid": "m",
    "label": "🔥 Five Door Test passes in a row this week"
   }
  ]
 }
];

export const TASKS = [
 {
  "id": "mon-zone-e-1",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "zone",
  "order": 1,
  "text": "Wipe BOTH door handles, both sides, and the light switches. Microfiber and the all-purpose spray",
  "notes": []
 },
 {
  "id": "mon-zone-e-2",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "zone",
  "order": 2,
  "text": "Every backpack on a hook, zipped, off the floor. Both doors",
  "notes": []
 },
 {
  "id": "mon-zone-e-3",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "zone",
  "order": 3,
  "text": "Every coat and jacket hung up. None on the bench, none on the stair rail",
  "notes": []
 },
 {
  "id": "mon-zone-e-4",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "zone",
  "order": 4,
  "text": "Wipe the bench and the shelf, odds and ends to their real spots",
  "notes": []
 },
 {
  "id": "mon-zone-m-1",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "zone",
  "order": 1,
  "text": "Every shoe matched into a pair, at both doors",
  "notes": []
 },
 {
  "id": "mon-zone-m-2",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "zone",
  "order": 2,
  "text": "All pairs in one straight row against the wall",
  "notes": []
 },
 {
  "id": "mon-zone-m-3",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "zone",
  "order": 3,
  "text": "Shoes that do not belong here go back to their own closet",
  "notes": []
 },
 {
  "id": "mon-zone-m-4",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "zone",
  "order": 4,
  "text": "Shake out both mats, then sweep both entry floors",
  "notes": []
 },
 {
  "id": "mon-reset-e-1",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "reset",
  "order": 1,
  "text": "Bed made, floor completely clear",
  "notes": []
 },
 {
  "id": "mon-reset-e-2",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "reset",
  "order": 2,
  "text": "Desk and nightstand cleared off",
  "notes": []
 },
 {
  "id": "mon-reset-e-3",
  "day": 1,
  "dayId": "mon",
  "kid": "e",
  "step": "reset",
  "order": 3,
  "text": "Dirty clothes in the hamper, nothing shoved under the bed",
  "notes": []
 },
 {
  "id": "mon-reset-m-1",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 1,
  "text": "Bed made, Sleep Squad on the pillows",
  "notes": []
 },
 {
  "id": "mon-reset-m-2",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 2,
  "text": "Headboard ledge is just for the decorations",
  "notes": []
 },
 {
  "id": "mon-reset-m-3",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 3,
  "text": "All three totes out, lids SNAPPED, slid back straight",
  "notes": []
 },
 {
  "id": "mon-reset-m-4",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 4,
  "text": "Nothing loose under the bed at all",
  "notes": []
 },
 {
  "id": "mon-reset-m-5",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 5,
  "text": "Window sill cleared, floor vents clear",
  "notes": []
 },
 {
  "id": "mon-reset-m-6",
  "day": 1,
  "dayId": "mon",
  "kid": "m",
  "step": "reset",
  "order": 6,
  "text": "Floor around the bed completely clear",
  "notes": []
 },
 {
  "id": "tue-zone-e-1",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "zone",
  "order": 1,
  "text": "Wipe the door handle and light switch. Microfiber and the all-purpose spray",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-e-2",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "zone",
  "order": 2,
  "text": "Toothbrushes and toothpaste put away in the drawer",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-e-3",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "zone",
  "order": 3,
  "text": "Everything else off the counter. Hair stuff in its bin, no cups, no bottles. Bare counter",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-e-4",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "zone",
  "order": 4,
  "text": "Hang the towels straight",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-e-5",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "zone",
  "order": 5,
  "text": "Bath toys back in their bin",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-m-1",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "zone",
  "order": 1,
  "text": "Both bathroom trashes emptied, new bags in",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-m-2",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "zone",
  "order": 2,
  "text": "Every piece of clothing off both bathroom floors. Dirty to the hamper, clean back to your room",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-m-3",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "zone",
  "order": 3,
  "text": "Everything else off both floors",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-zone-m-4",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "zone",
  "order": 4,
  "text": "Sweep both bathroom floors, behind the door and around the toilet base",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-e-1",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "reset",
  "order": 1,
  "text": "Clear the whole desk and dresser top",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-e-2",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "reset",
  "order": 2,
  "text": "Put away what belongs somewhere else",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-e-3",
  "day": 2,
  "dayId": "tue",
  "kid": "e",
  "step": "reset",
  "order": 3,
  "text": "Close every drawer all the way",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-m-1",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "reset",
  "order": 1,
  "text": "Bed made, Sleep Squad on the pillows",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-m-2",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "reset",
  "order": 2,
  "text": "Floor completely clear",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-m-3",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "reset",
  "order": 3,
  "text": "Clothes in the hamper or folded in the drawer",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-m-4",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "reset",
  "order": 4,
  "text": "Desk mat cleared to bare mat",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "tue-reset-m-5",
  "day": 2,
  "dayId": "tue",
  "kid": "m",
  "step": "reset",
  "order": 5,
  "text": "Every drawer pushed all the way in",
  "notes": [
   "tue-note-1"
  ]
 },
 {
  "id": "wed-zone-e-1",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "zone",
  "order": 1,
  "text": "Wipe the door handle and light switch. Microfiber and the all-purpose spray",
  "notes": []
 },
 {
  "id": "wed-zone-e-2",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "zone",
  "order": 2,
  "text": "Dust the high shelves and picture frames FIRST, high to low",
  "notes": []
 },
 {
  "id": "wed-zone-e-3",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "zone",
  "order": 3,
  "text": "Wipe the remotes and the controllers with a microfiber",
  "notes": [
   "wed-note-1"
  ]
 },
 {
  "id": "wed-zone-e-4",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "zone",
  "order": 4,
  "text": "Clear and wipe the coffee table and the end tables",
  "notes": []
 },
 {
  "id": "wed-zone-e-5",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "zone",
  "order": 5,
  "text": "Clear and wipe the TV stand, top AND shelves. Remotes to the remote spot, cords tucked",
  "notes": [
   "wed-note-1"
  ]
 },
 {
  "id": "wed-zone-m-1",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "zone",
  "order": 1,
  "text": "Everything on the floor that is not furniture goes to its real spot",
  "notes": []
 },
 {
  "id": "wed-zone-m-2",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "zone",
  "order": 2,
  "text": "Cushions straightened, pillows up, blankets folded",
  "notes": []
 },
 {
  "id": "wed-zone-m-3",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "zone",
  "order": 3,
  "text": "Look under the couch and behind the pillows",
  "notes": []
 },
 {
  "id": "wed-reset-e-1",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "reset",
  "order": 1,
  "text": "Clean clothes folded and put where they belong",
  "notes": []
 },
 {
  "id": "wed-reset-e-2",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "reset",
  "order": 2,
  "text": "Drawers actually close",
  "notes": []
 },
 {
  "id": "wed-reset-e-3",
  "day": 3,
  "dayId": "wed",
  "kid": "e",
  "step": "reset",
  "order": 3,
  "text": "Shoes paired on the closet floor",
  "notes": []
 },
 {
  "id": "wed-reset-m-1",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 1,
  "text": "Desk mat cleared to bare mat, chair pushed in",
  "notes": [
   "wed-note-2"
  ]
 },
 {
  "id": "wed-reset-m-2",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 2,
  "text": "Back ledge tidy, everything in the fidget caddy actually in it",
  "notes": []
 },
 {
  "id": "wed-reset-m-3",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 3,
  "text": "Desk lower shelf bins lined up straight in a row, lids on",
  "notes": []
 },
 {
  "id": "wed-reset-m-4",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 4,
  "text": "Dresser top down to the 5 things: lamp, jewelry stand, MVA box, frame, lava lamp",
  "notes": []
 },
 {
  "id": "wed-reset-m-5",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 5,
  "text": "Every dresser drawer pushed all the way in. If a drawer will not shut, it is too full, so fold it, do not shove it",
  "notes": []
 },
 {
  "id": "wed-reset-m-6",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 6,
  "text": "The four under-dresser bins pushed in",
  "notes": []
 },
 {
  "id": "wed-reset-m-7",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 7,
  "text": "Both pink towers closed, tops cleared",
  "notes": []
 },
 {
  "id": "wed-reset-m-8",
  "day": 3,
  "dayId": "wed",
  "kid": "m",
  "step": "reset",
  "order": 8,
  "text": "All clothing off the floor and out of the corners",
  "notes": []
 },
 {
  "id": "thu-zone-e-1",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "zone",
  "order": 1,
  "text": "Vacuum the living room, edges first, then the middle",
  "notes": [
   "thu-note-3"
  ]
 },
 {
  "id": "thu-zone-e-2",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "zone",
  "order": 2,
  "text": "Vacuum the hallway and your own bedroom, including under the bed",
  "notes": [
   "thu-note-3"
  ]
 },
 {
  "id": "thu-zone-e-3",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "zone",
  "order": 3,
  "text": "Sweep, then mop the kitchen floor",
  "notes": [
   "thu-note-1"
  ]
 },
 {
  "id": "thu-zone-e-4",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "zone",
  "order": 4,
  "text": "DUMP the mop water and refill it clean",
  "notes": [
   "thu-note-1"
  ]
 },
 {
  "id": "thu-zone-e-5",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "zone",
  "order": 5,
  "text": "Sweep, then mop both bathroom floors with the fresh water",
  "notes": [
   "thu-note-1"
  ]
 },
 {
  "id": "thu-zone-m-1",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "zone",
  "order": 1,
  "text": "Pick up every single thing off every floor first. That is what makes the vacuuming possible",
  "notes": [
   "thu-note-3"
  ]
 },
 {
  "id": "thu-zone-m-2",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "zone",
  "order": 2,
  "text": "Vacuum your own bedroom, including under the bed",
  "notes": [
   "thu-note-3"
  ]
 },
 {
  "id": "thu-reset-e-1",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 1,
  "text": "Carry off every single thing sitting on a step",
  "notes": [
   "thu-note-2",
   "thu-note-3"
  ]
 },
 {
  "id": "thu-reset-e-2",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 2,
  "text": "Wipe the handrail on the way up. Microfiber and the all-purpose spray",
  "notes": [
   "thu-note-2"
  ]
 },
 {
  "id": "thu-reset-e-3",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 3,
  "text": "Top step DOWN: brush the edges, the corners, and the front lip",
  "notes": [
   "thu-note-2"
  ]
 },
 {
  "id": "thu-reset-e-4",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 4,
  "text": "Sweep each step into the dustpan before moving down",
  "notes": [
   "thu-note-2"
  ]
 },
 {
  "id": "thu-reset-e-5",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 5,
  "text": "Do the tall part of the step, the bit you kick with your toe",
  "notes": [
   "thu-note-2"
  ]
 },
 {
  "id": "thu-reset-e-6",
  "day": 4,
  "dayId": "thu",
  "kid": "e",
  "step": "reset",
  "order": 6,
  "text": "Scuff marks with the eraser sponge, not a wet rag",
  "notes": []
 },
 {
  "id": "thu-reset-m-1",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "reset",
  "order": 1,
  "text": "Bed made, Sleep Squad on the pillows",
  "notes": []
 },
 {
  "id": "thu-reset-m-2",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "reset",
  "order": 2,
  "text": "Floor completely clear",
  "notes": []
 },
 {
  "id": "thu-reset-m-3",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "reset",
  "order": 3,
  "text": "Clothes in the hamper or folded in the drawer",
  "notes": []
 },
 {
  "id": "thu-reset-m-4",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "reset",
  "order": 4,
  "text": "Books back on the wall ledges, spines out",
  "notes": []
 },
 {
  "id": "thu-reset-m-5",
  "day": 4,
  "dayId": "thu",
  "kid": "m",
  "step": "reset",
  "order": 5,
  "text": "Every drawer pushed all the way in",
  "notes": []
 },
 {
  "id": "fri-zone-e-1",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "zone",
  "order": 1,
  "text": "Wipe the door handle and light switch. Microfiber and the all-purpose spray",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-e-2",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "zone",
  "order": 2,
  "text": "Clear the kitchen table to bare wood, then wipe it",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-e-3",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "zone",
  "order": 3,
  "text": "Wipe all three counters, top to bottom, one direction",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-e-4",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "zone",
  "order": 4,
  "text": "Wipe the island, the top and the edges",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-m-1",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "zone",
  "order": 1,
  "text": "Everything that is not kitchen stuff leaves the kitchen",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-m-2",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "zone",
  "order": 2,
  "text": "Spot-wipe the cabinet handles and any hand marks",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-m-3",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "zone",
  "order": 3,
  "text": "Empty the kitchen trash, new bag in, wipe the can if it is sticky",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-zone-m-4",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "zone",
  "order": 4,
  "text": "Sweep the kitchen floor, the corners and under the table and the island",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-e-1",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "reset",
  "order": 1,
  "text": "Run the 15 minute timer and the music",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-e-2",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "reset",
  "order": 2,
  "text": "Walk the LIVES SOMEWHERE ELSE pile to its real spots",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-e-3",
  "day": 5,
  "dayId": "fri",
  "kid": "e",
  "step": "reset",
  "order": 3,
  "text": "Take the GOES bag out to the car today",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-1",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 1,
  "text": "Stuffie basket at or under the top edge",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-2",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 2,
  "text": "Barbie shelf reset, all three Dreamhouse floors cleared",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-3",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 3,
  "text": "Books back on both wall ledges, spines out",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-4",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 4,
  "text": "Corner tidied up, closet baskets back, backpack hung",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-5",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 5,
  "text": "Dump the whole tote out on the bed",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-6",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 6,
  "text": "Three piles: lives here, lives elsewhere, goes",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-7",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 7,
  "text": "Refill and close the lid. Lid will not close? One more thing goes",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-8",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 8,
  "text": "Swap a few things with the Rotation Tote in the closet",
  "notes": [
   "fri-note-1"
  ]
 },
 {
  "id": "fri-reset-m-9",
  "day": 5,
  "dayId": "fri",
  "kid": "m",
  "step": "reset",
  "order": 9,
  "text": "GOES bag leaves the house today",
  "notes": [
   "fri-note-1"
  ]
 }
];

export const TOTES = [
 "Under-bed tote 1",
 "Under-bed tote 2",
 "Under-bed tote 3",
 "The stuffed animal basket",
 "The pink tower by the door",
 "The pink tower by the Barbie shelf",
 "The Barbie doll cube",
 "The four bins under the dresser",
 "The desk lower shelf bins",
 "The closet floor baskets"
];

export const WEEKEND = [
 "Laundry: sort it, run it, fold it, put it away",
 "Garbage out to the curb",
 "Recycling out to the curb"
];

export const SUNDAY_BLOCKS = [
 {
  "n": 1,
  "title": "Bedroom deep pass",
  "items": [
   "<b>Pull and Vacuum</b> under M's bed: all three totes out, vacuum, wipe the lids, slide them back",
   "The five <b>Sleep Squad</b> stuffies through the wash",
   "Wash both doormats with soap and water, <b>both sides</b>",
   "Open the <b>Maybe Box</b> and decide on anything that has been in there 4 weeks"
  ]
 },
 {
  "n": 2,
  "title": "Edges and vents",
  "items": [
   "Baseboards in the living room and the hallway",
   "Floor vents and registers, every room"
  ]
 },
 {
  "n": 3,
  "title": "Fronts and sills",
  "items": [
   "Cabinet fronts in the kitchen, <b>top cabinets and bottom cabinets</b>",
   "Windowsills, every room"
  ]
 },
 {
  "n": 4,
  "title": "Cans",
  "items": [
   "Wipe out the kitchen trash can itself, not just a new bag",
   "Wipe out <b>both bathroom</b> trash cans"
  ]
 },
 {
  "n": 5,
  "title": "Catch-up Sunday",
  "items": [
   "Nothing new. Finish anything from the first four Sundays that got missed",
   "If nothing was missed, this Sunday is off"
  ]
 }
];

export default TASKS;
