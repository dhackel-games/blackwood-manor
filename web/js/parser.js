// parser.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.082:acoven.
// Turns raw input into { verb, dobj, prep, iobj } (or { error }).
// Generic engine: contains no mansion-specific content.

const DIRECTIONS = {
  north: "north", n: "north", south: "south", s: "south", east: "east", e: "east",
  west: "west", w: "west", ne: "ne", nw: "nw", se: "se", sw: "sw",
  northeast: "ne", northwest: "nw", southeast: "se", southwest: "sw",
  up: "up", u: "up", down: "down", d: "down", dn: "down", in: "in", out: "out",
};

// canonical verb -> synonyms
const VERBS = {
  go: ["go", "g", "walk", "run", "float", "fly", "leave", "exit"], look: ["look", "l"], examine: ["examine", "ex", "x", "inspect"],
  take: ["take", "t", "get", "grab", "pick", "carry"], drop: ["drop", "discard"],
  open: ["open", "o", "pry", "force"], close: ["close", "c", "shut"],
  lock: ["lock", "lk"], unlock: ["unlock", "un"],
  read: ["read"], search: ["search"], move: ["move", "shift", "jostle", "shake", "nudge"], push: ["push", "press"],
  pull: ["pull", "lift", "yank", "peel"], on: ["on"], off: ["off"], light: ["light", "ignite"],
  burn: ["burn", "incinerate", "torch", "immolate", "combust"],
  extinguish: ["extinguish", "douse", "blow"], attack: ["attack", "kill", "hit", "strike", "stab"],
  eat: ["eat"], drink: ["drink"], wear: ["wear", "don"], remove: ["remove", "doff"],
  throw: ["throw", "toss"], put: ["put", "place", "insert"], enter: ["enter", "in", "board", "ride", "step"],
  climb: ["climb", "descend"], reach: ["reach"], ring: ["ring"], touch: ["touch"], listen: ["listen"],
  smell: ["smell", "sniff"], give: ["give", "offer", "feed"],
  show: ["show"], route: ["route", "guide", "path"],
  talk: ["talk", "speak", "chat"], say: ["say", "yell", "shout", "answer", "recite"],
  wake: ["wake", "awaken", "rouse"],
  pray: ["pray", "perform"],
  sit: ["sit"], use: ["use", "u"], flush: ["flush"],
  hotline: ["hotline", "call", "dial", "phone", "telephone", "hint", "hints"],
  inventory: ["inventory", "i", "inv"], wait: ["wait", "z"], again: ["again"],
  map: ["map", "m", "chart", "floorplan"],
  code: ["code", "combination"],
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
const NOUN_SHORTCUTS = Object.freeze({ d: "door", br: "bedroom" });
const QUOTE_CHARS = new Set(['"', "'", "`"]);

function tokenize(input) {
  const tokens = [];
  let value = "";
  let quote = null;
  let quoted = false;
  const flush = () => {
    if (value || quoted) tokens.push({ value, quoted });
    value = "";
    quoted = false;
  };
  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null;
      else value += char;
      continue;
    }
    if (!value && QUOTE_CHARS.has(char)) {
      quote = char;
      quoted = true;
      continue;
    }
    if (/\s/.test(char)) {
      flush();
      continue;
    }
    value += char;
  }
  flush();
  return tokens;
}

// Split a raw input line into separate commands.
// Classic-parser separators: "." ";" "," and the word "then".
// Used by core.send so "n. open mailbox. read letter" runs as three turns.
export function splitCommands(input) {
  const raw = (input || "").trim();
  if (!raw) return [];
  const commands = [];
  let current = "";
  let quote = null;
  const flush = () => {
    const command = current.trim();
    if (command) commands.push(command);
    current = "";
  };
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (QUOTE_CHARS.has(char) && (index === 0 || /\s/.test(raw[index - 1]))) {
      quote = char;
      current += char;
      continue;
    }
    if (char === "." || char === ";" || char === ",") {
      flush();
      continue;
    }
    if (raw.slice(index, index + 4).toLowerCase() === "then" &&
        index > 0 && /\s/.test(raw[index - 1]) &&
        index + 4 < raw.length && /\s/.test(raw[index + 4])) {
      flush();
      index += 3;
      continue;
    }
    current += char;
  }
  flush();
  return commands;
}

export function parse(input) {
  const raw = (input || "").trim().toLowerCase().replace(/\bw\/\s*/g, "with ");
  if (!raw) return { verb: null, dobj: null, prep: null, iobj: null, error: "empty" };
  if (raw === "g") return { verb: "again", dobj: null, prep: null, iobj: null };
  if (/^[\d\s-]+$/.test(raw) && /\d/.test(raw)) {
    return { verb: "code", dobj: raw, prep: null, iobj: null };
  }

  let words = tokenize(raw).filter((word) =>
    word.value && (word.quoted || !ARTICLES.has(word.value)));
  if (!words.length) return { verb: null, dobj: null, prep: null, iobj: null, error: "empty" };

  // Bare direction => go <dir>
  if (words.length === 1 && !words[0].quoted && DIRECTIONS[words[0].value]) {
    return { verb: "go", dobj: DIRECTIONS[words[0].value], prep: null, iobj: null };
  }

  // "turn on/off X" => verb on/off
  if (words[0].value === "turn" &&
      (words[1]?.value === "on" || words[1]?.value === "off")) {
    words = [words[1], ...words.slice(2)];
  }

  let verb = SYN[words[0].value];
  if (!verb) {
    return {
      verb: null,
      dobj: null,
      prep: null,
      iobj: null,
      error: "unknown-verb",
      word: words[0].value,
    };
  }
  let rest = words.slice(1);
  if ((words[0].value === "leave" || words[0].value === "exit") && !rest.length) {
    return { verb: "go", dobj: "out", prep: null, iobj: null };
  }
  if (verb === "enter" && !rest.length) {
    return { verb: "go", dobj: "in", prep: null, iobj: null };
  }

  // All item-inspection phrasings converge on EXAMINE. With no noun they
  // remain room-inspection commands ("look", "look at", "search", "examine").
  if ((verb === "look" || verb === "search") &&
      !rest[0]?.quoted &&
      (rest[0]?.value === "at" || rest[0]?.value === "in" || rest[0]?.value === "inside")) {
    rest = rest.slice(1);
  }
  if ((verb === "look" || verb === "search") && rest.length) verb = "examine";

  // Named travel: "go to kitchen", "float to attic", "fly to the garden".
  if (verb === "go" && !rest[0]?.quoted && rest[0]?.value === "to") rest = rest.slice(1);

  // "go north" / "go n" / "climb up"
  if ((verb === "go" || verb === "climb") && rest.length &&
      !rest[0].quoted && DIRECTIONS[rest[0].value]) {
    return { verb: "go", dobj: DIRECTIONS[rest[0].value], prep: null, iobj: null };
  }
  if (verb !== "say") {
    rest = rest.map((word) => ({
      ...word,
      value: word.quoted ? word.value : (NOUN_SHORTCUTS[word.value] || word.value),
    }));
  }
  // "pick up X" / "take up X" => drop the stray "up"
  if (verb === "take" && !rest[0]?.quoted && rest[0]?.value === "up") rest = rest.slice(1);
  if (verb === "wake" && !rest[0]?.quoted && rest[0]?.value === "up") rest = rest.slice(1);

  // Split remaining words on the first preposition.
  let prep = null, dobjWords = [], iobjWords = [], seenPrep = false;
  for (const word of rest) {
    if (!seenPrep && !word.quoted && PREPS.has(word.value)) {
      prep = word.value;
      seenPrep = true;
      continue;
    }
    (seenPrep ? iobjWords : dobjWords).push(word.value);
  }
  const join = (arr) => (arr.length ? arr.join(" ") : null);
  let dobj = join(dobjWords);
  let iobj = join(iobjWords);
  if (verb === "talk" && !dobj && iobj) {
    dobj = iobj;
    iobj = null;
    prep = null;
  }
  if (verb === "drop" && (dobj === "all" || dobj === "everything") &&
      (prep === "in" || prep === "into" || prep === "inside") && iobj) {
    verb = "put";
  }
  if (verb === "route" && !dobj && prep === "to" && iobj) {
    dobj = iobj;
    prep = null;
    iobj = null;
  }
  return { verb, dobj, prep, iobj };
}
