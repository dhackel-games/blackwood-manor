// map.js — MAP MODE. Gary's hand-drawn floor plan of Blackwood Manor, on a page
// torn out of the hint-line binder.
//
// Content-free engine glue: the layout below is the only place that knows what
// the manor looks like, and it is pure data.
//
// Two rules, both about not ruining the game:
//   1. A room you have not entered shows as ????? — you get the SHAPE of the
//      house (which is what an actual stuck player needs) without being handed
//      rooms you were supposed to find.
//   2. Secret places are not drawn at all until you have stood in them. The
//      hidden wing and the chamber under the library are the best discoveries
//      in the game and a map that spoils them is worse than no map.

const W = 14;   // label cell width — every label is padded to this, so the art
const GAP = 6;  // stays aligned no matter which names are masked
const ROWH = 3; // lines between one row of rooms and the next

// Short names, because a sketch has no room for "Master Bedroom".
const LABELS = {
  gate: "Front Gate", garden: "Garden", privy: "Privy", porch: "Porch",
  grandHall: "Grand Hall", parlor: "Parlor", library: "Library",
  diningRoom: "Dining Rm", kitchen: "Kitchen", landing: "Landing",
  nursery: "Nursery", masterBedroom: "Master Bed", study: "Study",
  attic: "Attic", wineCellar: "Cellar", crypt: "Crypt",
  secretChamber: "Hidden Rm", hollowPassage: "Passage", hollowSanctum: "Sanctum",
};

// Rooms that must not appear on the map until you have been there.
const SECRET = new Set(["hollowPassage", "hollowSanctum", "secretChamber"]);

// Each floor: rooms placed on a grid, plus the links between them. `note` is the
// little annotation on a connector ("down", "ladder").
const FLOORS = [
  {
    title: "UPSTAIRS",
    rooms: [
      { id: "attic", col: 1, row: 0 },
      { id: "nursery", col: 0, row: 1 },
      { id: "landing", col: 1, row: 1 },
      { id: "masterBedroom", col: 2, row: 1 },
      { id: "study", col: 1, row: 2 },
    ],
    links: [
      { a: "attic", b: "landing", note: "ladder" },
      { a: "nursery", b: "landing" },
      { a: "landing", b: "masterBedroom" },
      { a: "landing", b: "study" },
    ],
    foot: "Landing goes DOWN to the Grand Hall.",
    footIf: "landing",
  },
  {
    title: "GROUND FLOOR",
    rooms: [
      { id: "hollowSanctum", col: 1, row: 0 },
      { id: "hollowPassage", col: 1, row: 1 },
      { id: "diningRoom", col: 0, row: 2 },
      { id: "grandHall", col: 1, row: 2 },
      { id: "parlor", col: 2, row: 2 },
      { id: "kitchen", col: 0, row: 3 },
      { id: "porch", col: 1, row: 3 },
      { id: "library", col: 2, row: 3 },
    ],
    links: [
      { a: "hollowSanctum", b: "hollowPassage" },
      { a: "hollowPassage", b: "grandHall" },
      { a: "diningRoom", b: "grandHall" },
      { a: "grandHall", b: "parlor" },
      { a: "diningRoom", b: "kitchen" },
      { a: "grandHall", b: "porch" },
      { a: "parlor", b: "library" },
    ],
    foot: "Grand Hall goes UP to the Landing.",
    footIf: "grandHall",  // naming rooms you've never seen is a spoiler
  },
  {
    title: "THE GROUNDS",
    rooms: [
      { id: "porch", col: 0, row: 0, anchor: true },
      { id: "gate", col: 0, row: 1 },
      { id: "garden", col: 1, row: 1 },
      { id: "privy", col: 2, row: 1 },
    ],
    links: [
      { a: "porch", b: "gate" },
      { a: "gate", b: "garden" },
      { a: "garden", b: "privy" },
    ],
    foot: "A well drops into the dark below the Garden.",
    footIf: "garden",  // don't mention the well before you've seen the garden
  },
  {
    title: "BELOW",
    rooms: [
      { id: "kitchen", col: 0, row: 0, anchor: true },
      { id: "library", col: 2, row: 0, anchor: true },
      { id: "wineCellar", col: 0, row: 1 },
      { id: "secretChamber", col: 2, row: 1 },
      { id: "crypt", col: 0, row: 2 },
    ],
    links: [
      { a: "kitchen", b: "wineCellar", note: "down" },
      { a: "wineCellar", b: "crypt" },
      { a: "library", b: "secretChamber", note: "down" },
    ],
  },
];

const centre = (s, w) => {
  const pad = Math.max(0, w - s.length);
  const left = Math.floor(pad / 2);
  return " ".repeat(left) + s + " ".repeat(pad - left);
};

const colX = (col) => col * (W + GAP);
const midX = (col) => colX(col) + Math.floor(W / 2);

// --- canvas ----------------------------------------------------------------
function makeCanvas(h, w) {
  return Array.from({ length: h }, () => Array(w).fill(" "));
}
function put(canvas, y, x, text) {
  if (y < 0 || y >= canvas.length) return;
  for (let i = 0; i < text.length; i++) {
    const cx = x + i;
    if (cx >= 0 && cx < canvas[y].length) canvas[y][cx] = text[i];
  }
}

function drawFloor(floor, ctx) {
  // You are standing in it, so you have plainly seen it — this also covers the
  // very first turn, before describeRoom() has had a chance to set the flag.
  const seen = (id) => id === ctx.state.room || !!ctx.getFlag("seen:" + id);
  const rooms = floor.rooms.filter((r) => !SECRET.has(r.id) || seen(r.id));
  if (!rooms.some((r) => seen(r.id) && !r.anchor)) return null; // nothing known here yet

  // An anchor is only a landmark, never a destination. Drop it unless you've
  // actually stood in it AND it still connects to something real on this floor:
  // a lone "(Library)" floating in the BELOW panel announces the secret chamber.
  const present = new Set(rooms.map((r) => r.id));
  const isAnchor = (id) => (floor.rooms.find((r) => r.id === id) || {}).anchor;
  const connectsToReal = (id) => floor.links.some((l) =>
    (l.a === id && present.has(l.b) && !isAnchor(l.b)) ||
    (l.b === id && present.has(l.a) && !isAnchor(l.a)));
  const visible = rooms.filter((r) => !r.anchor || (seen(r.id) && connectsToReal(r.id)));

  const usedRows = [...new Set(visible.map((r) => r.row))].sort((a, b) => a - b);
  const rowIndex = new Map(usedRows.map((r, i) => [r, i]));
  const placed = new Map(visible.map((r) => [r.id, { ...r, row: rowIndex.get(r.row) }]));

  const list = [...placed.values()];
  const maxCol = Math.max(...list.map((r) => r.col));
  const maxRow = Math.max(...list.map((r) => r.row));
  const canvas = makeCanvas(maxRow * ROWH + 1, colX(maxCol) + W + 2);

  for (const r of list) {
    const name = seen(r.id) ? (LABELS[r.id] || r.id) : "?????";
    // An anchor is a room repeated from another floor purely to show how the
    // floors join. Never mark it, or "X" appears twice and means nothing.
    const label = (ctx.state.room === r.id && !r.anchor) ? "X " + name
                : r.anchor ? "(" + name + ")"
                : name;
    put(canvas, r.row * ROWH, colX(r.col), centre(label, W));
  }

  for (const link of floor.links) {
    const a = placed.get(link.a), b = placed.get(link.b);
    if (!a || !b) continue;
    if (a.row === b.row) {                       // horizontal run of dashes
      const [l, r] = a.col < b.col ? [a, b] : [b, a];
      const from = colX(l.col) + W, to = colX(r.col);
      put(canvas, a.row * ROWH, from, "-".repeat(Math.max(0, to - from)));
    } else {                                     // vertical, with optional note
      const [t, bt] = a.row < b.row ? [a, b] : [b, a];
      const x = midX(t.col);
      for (let y = t.row * ROWH + 1; y < bt.row * ROWH; y++) put(canvas, y, x, "|");
      if (link.note) put(canvas, t.row * ROWH + Math.floor(ROWH / 2), x + 2, "(" + link.note + ")");
    }
  }

  const lines = canvas.map((row) => row.join("").replace(/\s+$/, ""));
  const foot = floor.footIf && !seen(floor.footIf) ? null : floor.foot;
  return { title: floor.title, foot, lines };
}

// --- the torn page ----------------------------------------------------------
// A straight rectangle would look like a dialog box. The edges wander by a
// character or two so it reads as a page ripped out of Gary's binder.
//
// The wander is applied to the border column ONLY — the text block always
// starts at the same column. An edge that pushed the content around looked
// like corruption rather than paper.
const LEFT_JAG = [1, 0, 1, 2, 1, 1, 0, 1, 2, 2, 1, 0, 0, 1, 2, 1, 1, 0];
const RIGHT_JAG = [0, 1, 2, 1, 1, 0, 1, 2, 2, 1, 0, 1, 1, 2, 0, 0, 1, 2];
const PAD = 3;  // fixed gutter between the torn edge and the text

// Gary faxed this to himself before tearing it out, and never trimmed the
// perforated feed strip off either side. A fixed, unjagged column of punch
// holes down each margin — deliberately NOT wandering like the torn edge, so
// it reads as tractor-feed stock rather than more damage to the page.
const HOLE_GAP = 3;              // rows between holes, like real fax paper
const HOLE_MARGIN = "  o  ";     // sprocket hole + its fixed gutter
const HOLE_BLANK = " ".repeat(HOLE_MARGIN.length);
const hole = (i) => (i % HOLE_GAP === 0 ? HOLE_MARGIN : HOLE_BLANK);

function tornPage(lines) {
  const inner = Math.max(44, ...lines.map((l) => l.length));
  const out = [];

  const ripple = (pattern, n) => {
    let s = "";
    while (s.length < n) s += pattern;
    return s.slice(0, n);
  };
  const width = PAD + 2 + inner + PAD;

  out.push(" " + ripple("_.-'~`-._.-'`~'-", width));
  lines.forEach((line, i) => {
    const l = LEFT_JAG[i % LEFT_JAG.length];
    const r = RIGHT_JAG[i % RIGHT_JAG.length];
    const lch = l === 0 ? "\\" : l === 1 ? "|" : "/";
    const rch = r === 0 ? "/" : r === 1 ? "|" : "\\";
    out.push(" ".repeat(l) + lch + " ".repeat(PAD + 1 - l) +
             line + " ".repeat(inner - line.length) +
             " ".repeat(r + 1) + rch);
  });
  out.push("  " + ripple("`'~-._.~'`-._.-", width - 2));
  return out.map((row, i) => hole(i) + row + hole(i)).join("\n");
}

// Sentinel wrapping the ASCII block. The transcript is `white-space: pre-wrap`,
// which would fold the map into confetti on a phone, and the TTS voice would
// happily read the torn edge out loud. The UI splits on this to render the map
// in a non-wrapping element and to keep it out of Gary's mouth. U+001F never
// occurs in game text.
export const MAP_MARK = "\u001F";

export function renderMap(ctx) {
  const body = [];
  body.push(centre("BLACKWOOD MANOR", 34));
  body.push(centre("- as sketched by Gary -", 34));
  body.push("");

  let drew = false;
  for (const floor of FLOORS) {
    const f = drawFloor(floor, ctx);
    if (!f) continue;
    drew = true;
    body.push("  " + f.title);
    body.push("  " + "=".repeat(f.title.length));
    body.push(...f.lines);
    if (f.foot) body.push("  " + f.foot);
    body.push("");
  }
  if (!drew) body.push("  You haven't been anywhere yet.");

  body.push("  X = you are here.   ????? = not yet explored.");
  return MAP_MARK + tornPage(body) + MAP_MARK;
}
