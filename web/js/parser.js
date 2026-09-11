// parser.js — turns raw input into { verb, dobj, prep, iobj } (or { error }).
// Generic engine: contains no mansion-specific content.

const DIRECTIONS = {
  north: "north", n: "north", south: "south", s: "south", east: "east", e: "east",
  west: "west", w: "west", ne: "ne", nw: "nw", se: "se", sw: "sw",
  up: "up", u: "up", down: "down", d: "down", in: "in", out: "out",
};

// canonical verb -> synonyms
const VERBS = {
  go: ["go", "walk", "run", "float", "fly"], look: ["look", "l"], examine: ["examine", "ex", "x", "inspect"],
  take: ["take", "get", "grab", "pick", "carry"], drop: ["drop", "discard"],
  open: ["open"], close: ["close", "shut"], lock: ["lock"], unlock: ["unlock"],
  read: ["read"], search: ["search"], move: ["move", "shift"], push: ["push", "press"],
  pull: ["pull", "lift", "yank"], on: ["on"], off: ["off"], light: ["light", "ignite"],
  burn: ["burn", "incinerate", "torch", "immolate", "combust"],
  extinguish: ["extinguish", "douse", "blow"], attack: ["attack", "kill", "hit", "strike", "stab"],
  eat: ["eat"], drink: ["drink"], wear: ["wear", "don"], remove: ["remove", "doff"],
  throw: ["throw", "toss"], put: ["put", "place", "insert"], enter: ["enter"],
  climb: ["climb", "descend"], reach: ["reach"], ring: ["ring"], touch: ["touch"], listen: ["listen"],
  smell: ["smell", "sniff"], give: ["give"], pray: ["pray", "perform"],
  sit: ["sit"], use: ["use"], flush: ["flush"],
  hotline: ["hotline", "call", "dial", "phone", "telephone", "hint", "hints"],
  inventory: ["inventory", "i", "inv"], wait: ["wait", "z"], again: ["again", "g"],
  map: ["map", "m", "chart", "floorplan"],
  yes: ["yes", "y", "yeah", "yep"], no: ["no", "nope", "nah"],
  score: ["score"], save: ["save"], restore: ["restore", "load"], restart: ["restart"],
  verbose: ["verbose"], brief: ["brief"], help: ["help", "?", "commands"], quit: ["quit", "q"],
};
const SYN = {};
for (const [canon, list] of Object.entries(VERBS)) {
  for (const w of list) if (!(w in SYN)) SYN[w] = canon;
}

const ARTICLES = new Set(["the", "a", "an", "some"]);
const PREPS = new Set(["with", "in", "into", "on", "onto", "at", "to", "from", "under", "behind", "inside"]);

// Split a raw input line into separate commands.
// Classic-parser separators: "." ";" "," and the word "then".
// Used by core.send so "n. open mailbox. read letter" runs as three turns.
export function splitCommands(input) {
  const raw = (input || "").trim();
  if (!raw) return [];
  return raw
    .split(/\s*[.;,]+\s*|\s+then\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parse(input) {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return { verb: null, dobj: null, prep: null, iobj: null, error: "empty" };

  let words = raw.split(/\s+/).filter((w) => w && !ARTICLES.has(w));
  if (!words.length) return { verb: null, dobj: null, prep: null, iobj: null, error: "empty" };

  // Bare direction => go <dir>
  if (words.length === 1 && DIRECTIONS[words[0]]) {
    return { verb: "go", dobj: DIRECTIONS[words[0]], prep: null, iobj: null };
  }

  // "turn on/off X" => verb on/off
  if (words[0] === "turn" && (words[1] === "on" || words[1] === "off")) {
    words = [words[1], ...words.slice(2)];
  }

  let verb = SYN[words[0]];
  if (!verb) {
    return { verb: null, dobj: null, prep: null, iobj: null, error: "unknown-verb", word: words[0] };
  }
  let rest = words.slice(1);

  // All item-inspection phrasings converge on EXAMINE. With no noun they
  // remain room-inspection commands ("look", "look at", "search", "examine").
  if ((verb === "look" || verb === "search") &&
      (rest[0] === "at" || rest[0] === "in" || rest[0] === "inside")) {
    rest = rest.slice(1);
  }
  if ((verb === "look" || verb === "search") && rest.length) verb = "examine";

  // Named travel: "go to kitchen", "float to attic", "fly to the garden".
  if (verb === "go" && rest[0] === "to") rest = rest.slice(1);

  // "go north" / "go n" / "climb up"
  if ((verb === "go" || verb === "climb") && rest.length && DIRECTIONS[rest[0]]) {
    return { verb: "go", dobj: DIRECTIONS[rest[0]], prep: null, iobj: null };
  }
  // "pick up X" / "take up X" => drop the stray "up"
  if (verb === "take" && rest[0] === "up") rest = rest.slice(1);

  // Split remaining words on the first preposition.
  let prep = null, dobjWords = [], iobjWords = [], seenPrep = false;
  for (const w of rest) {
    if (!seenPrep && PREPS.has(w)) { prep = w; seenPrep = true; continue; }
    (seenPrep ? iobjWords : dobjWords).push(w);
  }
  const join = (arr) => (arr.length ? arr.join(" ") : null);
  return { verb, dobj: join(dobjWords), prep, iobj: join(iobjWords) };
}
