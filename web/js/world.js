// world.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.068:acoven.
// ALL CONTENT for Blackwood Manor.
// This is the ONLY file you edit to expand the game. The engine (core/parser/
// commands) never needs to change. See README.md for the "how to add a room" guide.
//
// Handler API (ctx) available inside on:{ verb(ctx, cmd) } functions:
//   ctx.print via return value      ctx.getFlag(f) / ctx.setFlag(f,[v])
//   ctx.has(id) (in inventory)      ctx.here(id) (in current room)
//   ctx.item(id) -> live item       ctx.roomOf(id) -> location
//   ctx.itemsIn(loc) / ctx.inventory() / ctx.inventoryLoad()
//   ctx.inventoryCapacity() / ctx.find(phrase[,scope])
//   ctx.moveItem(id,to) / ctx.destroy(id)
//   ctx.addScore(n) / ctx.kill(msg) / ctx.win(msg) / ctx.describeRoom()
// A handler that returns a string intercepts the default verb; returning null/
// undefined lets the default behaviour run.

import { MAP_MARK, renderMap } from "./map.js?v=source";

// ---- helpers used by handlers ------------------------------------------------
export const REQUIRED_FAMILY_ITEM_COUNT = 13;

export const ITEM_SHORT_NAMES = Object.freeze({
  reliquary: "reliquary",
  bell: "bell",
  mysteryPackage: "package",
  lightningBolt: "lightning",
  statue: "statue",
  well: "well",
  frontKey: "iron",
  mailbox: "mailbox",
  letter: "letter",
  brazier: "brazier",
  emberStone: "emerald",
  greenGlassStone: "ruby",
  blueGlassStone: "sapphire",
  oakMechanism: "panel",
  oakPlatform: "platform",
  signalFlags: "flags",
  blanketHideout: "hideout",
  woodenSlingshot: "slingshot",
  spyglassCradle: "cradle",
  spyglass: "spyglass",
  mushrooms: "dried",
  outhouseMushrooms: "fresh",
  burrito: "burrito",
  obsidianEye: "obsidian",
  burritoWrapper: "wrapper",
  milk: "milk",
  apple: "apple",
  toilet: "toilet",
  dreadmaw: "dragon",
  goldDoubloon: "doubloon",
  dragonVaultDoor: "vaultdoor",
  caveTroll: "troll",
  dragonHoard: "hoard",
  familyRing: "family",
  backpack: "backpack",
  headlamp: "headlamp",
  wingedShoes: "shoes",
  familyCrest: "crest",
  hallBed: "hallbed",
  hallMirror: "hallmirror",
  nightTable: "nightstand",
  nightDrawer: "drawer",
  bedsideLamp: "bedlamp",
  xrayGoggles: "goggles",
  frontDoor: "frontdoor",
  candlestick: "candlestick",
  matches: "matches",
  rope: "coil",
  cellarDoor: "cellardoor",
  lever: "lever",
  grimoire: "grimoire",
  portrait: "profile",
  safe: "safe",
  talisman: "talisman",
  desk: "desk",
  diary: "diary",
  wallpaper: "wallpaper",
  musicBox: "musicbox",
  tinyKey: "tiny",
  jewelryBox: "jewelry",
  rubyRing: "bloodsignet",
  wraith: "wraith",
  goldLocket: "locket",
  cord: "cord",
  ancientCoin: "ancient",
  crystalDecanter: "decanter",
  ancestralPortrait: "ancestral",
  boneKey: "bone",
  secretDoor: "secret",
  spirit: "matriarch",
  silverMirror: "silver",
  backwardsWatch: "watch",
});

export const ROOM_SHORT_NAMES = Object.freeze({
  gate: "gate",
  garden: "garden",
  hedgeMazeGate: "yewgate",
  hedgeMazeKnot: "thornknot",
  hedgeMazeLoop: "loop",
  dragonCaveMouth: "cavemouth",
  dragonAntechamber: "antechamber",
  mineGallery: "gallery",
  deepShaft: "shaft",
  trollGate: "trollgate",
  dreadmawVault: "dreadvault",
  privy: "privy",
  greatOak: "oak",
  treeFort: "fort",
  porch: "porch",
  grandHall: "royal",
  parlor: "parlor",
  library: "library",
  secretChamber: "hidden",
  diningRoom: "dining",
  kitchen: "kitchen",
  wineCellar: "wine",
  crypt: "crypt",
  landing: "landing",
  nursery: "nursery",
  masterBedroom: "grand",
  hallBedroom: "hallbedroom",
  study: "study",
  attic: "attic",
  roof: "roof",
  belfry: "belfry",
  hiddenVault: "astral",
  hollowPassage: "passage",
  hollowSanctum: "sanctum",
  garysLair: "gary",
  betweenWalls: "between",
});

function depositedFamilyItemCount(ctx) {
  return Object.entries(ctx.world.items)
    .filter(([, definition]) => definition.treasure)
    .filter(([id]) => ctx.roomOf(id) === "reliquary")
    .length;
}
function allTreasuresDeposited(ctx) {
  const requiredItems = Object.values(ctx.world.items).filter((definition) => definition.treasure);
  return requiredItems.length === REQUIRED_FAMILY_ITEM_COUNT
    && depositedFamilyItemCount(ctx) === REQUIRED_FAMILY_ITEM_COUNT;
}
function nestedContents(ctx, containerId, seen = new Set()) {
  if (seen.has(containerId)) return [];
  seen.add(containerId);
  const direct = ctx.itemsIn(containerId);
  return direct.flatMap((item) => [item, ...nestedContents(ctx, item.id, seen)]);
}
function reliquaryStatus(ctx) {
  const contents = nestedContents(ctx, "reliquary");
  if (!contents.length) return null;
  const contributing = contents.filter((item) =>
    ctx.world.items[item.id]?.treasure && ctx.roomOf(item.id) === "reliquary").length;
  return {
    contributing,
    required: REQUIRED_FAMILY_ITEM_COUNT,
    nonContributing: contents.length - contributing,
  };
}

// Completing the family collection also wakes the house's true secret: a
// staircase folds open in the floor of the royal hall. The dawn ending via the
// BELL stays available, so the player gets a real choice.
function everythingDeposited(ctx) {
  return Object.entries(ctx.world.items)
    .filter(([, d]) => d.treasure)
    .every(([id]) => ctx.roomOf(id) === "reliquary");
}

// Persist the final score as a seed for BLACKWOOD MANOR II. Browser-only; the
// node test harness has no localStorage, so this is a guarded nice-to-have.
function saveBm2Seed(ctx) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("blackwood-bm2-seed-v1", JSON.stringify({
        score: ctx.state.score, turns: ctx.state.turns, savedAt: Date.now(),
      }));
    }
  } catch { /* storage unavailable — the seed is optional */ }
}

// The TRUE ending (secret): once every required heirloom is in the reliquary, a
// trapdoor opens in the floor of the royal hall. Go DOWN and you finally meet
// the voice that's been "helping" you all night — Gary, in the flesh, in his
// squalid basement call-cave, phone still ringing. He clubs you with the receiver and bolts up
// the stairs with your loot. Not a death, not a clean escape: a cliffhanger
// into BM2. (See DESIGN.md §12.30.)
function garyEnding(ctx) {
  const scene =
    "You descend the impossible stair into a low, damp room lit by a single bare bulb.\n\n" +
    "And there — at a battered desk, hunched over an avocado-green ROTARY PHONE, mid-sentence — is " +
    "GARY. The Hint Line. The voice that has ridden along in your ear all night. On the desk before " +
    "him: a monstrous BURRITO stuffed with every spicy thing, a heap of his precious MUSHROOMS, and a " +
    "sweating carton of MILK from a humming mini-FRIDGE. A tangle of phone cord vanishes up into the dark.\n\n" +
    "\"—no, no, you MOVE the statue, THEN you—\" He looks up. He sees you. Understanding, then pure " +
    "animal joy, breaks across his face.\n\n" +
    "\"You. You actually FINISHED it.\" He rises, the heavy receiver already swinging. \"Do you have any " +
    "idea what that means for me?\"\n\n" +
    "The rotary phone catches you across the temple with a bright electric CLANG. The floor tilts. The " +
    "last thing you see is Gary — YOUR heirlooms already bundled under one arm — taking the stairs three " +
    "at a time toward the front door of Blackwood Manor, howling one word into the dark:\n\n" +
    MAP_MARK + GARY_LAIR_ART + MAP_MARK + "\n\n" +
    "\"FREEEEDOMMM!\"";
  const result = ctx.finish(scene,
    "    ****  TO BE CONTINUED in BLACKWOOD MANOR II: HELD  ****\n\n" +
    "You came to loot a haunted house. You leave as its newest tenant — and the phone is already ringing.\n" +
    "(Your final score has been saved. In BM2, Gary profits when you fail. Sleep on that.)");
  saveBm2Seed(ctx);
  return result;
}

// ---- Super-user / debug console ---------------------------------------------
// A hidden playtesting aid, entered as a normal command: `su`, or `su <cmd>`.
// It does NOT advance a game turn, so poking around never trips lightning,
// burn-up, or affliction ticks. Purely for humans checking the game out —
// jump anywhere, reveal the map, dump state, fill the reliquary, or fast-forward
// to either ending to inspect it in isolation. See DESIGN.md §12.31.
const SU_HELP = [
  "== BLACKWOOD MANOR : SUPER-USER CONSOLE ==",
  "  (debug only - does not pass a turn)",
  "",
  "  su                  this menu",
  "  su rooms            list every room id + name",
  "  su goto <room>      teleport to a room (id or name)",
  "  su where            dump this room's exits + items",
  "  su map              reveal and print the whole map",
  "  su items            list every item and where it is",
  "  su give <item|all>  put portable item(s) in inventory",
  "  su equip all        equip one power item in every body slot",
  "  su fill [required]  deposit required or EVERY treasure",
  "                      (all treasure opens both endings)",
  "  su maxscore         set the maximum attainable score",
  "  su win              jump to the dawn ending",
  "  su gary             jump to the secret Gary ending",
  "  su light            toggle seeing in the dark",
  "  su god              toggle invincibility (survive death)",
  "  su heal             clear fire / sickness / trip",
  "  su score <n>        set your score",
  "  su flags            dump the live game flags",
].join("\n");

function suWrap(text) { return MAP_MARK + text + MAP_MARK; }

function suResolveRoom(ctx, phrase) {
  const raw = (phrase || "").trim();
  if (!raw) return null;
  if (ctx.world.rooms[raw]) return raw; // exact id
  const want = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!want) return null;
  let partial = null;
  for (const [id, room] of Object.entries(ctx.world.rooms)) {
    const names = [ctx.world.roomShortNames?.[id], id, room.name, ...(room.aliases || [])]
      .filter(Boolean)
      .map((n) => String(n).toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (names.some((n) => n === want)) return id;
    if (!partial && names.some((n) => n.includes(want))) partial = id;
  }
  return partial;
}

function suResolveItem(ctx, phrase) {
  const raw = (phrase || "").trim().toLowerCase();
  if (!raw) return null;
  if (ctx.item(raw)) return raw; // exact id
  const norm = raw.replace(/[^a-z0-9]/g, "");
  for (const [id, def] of Object.entries(ctx.world.items)) {
    const names = [ctx.world.itemShortNames?.[id], ...(def.names || [])]
      .filter(Boolean)
      .map((n) => String(n).toLowerCase());
    if (id.toLowerCase() === raw || names.includes(raw)) return id;
  }
  let partial = null;
  for (const [id, def] of Object.entries(ctx.world.items)) {
    const names = [ctx.world.itemShortNames?.[id], ...(def.names || [])]
      .filter(Boolean)
      .map((n) => String(n).toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (id.toLowerCase().replace(/[^a-z0-9]/g, "").includes(norm) || names.some((n) => n.includes(norm))) {
      partial = partial || id;
    }
  }
  return partial;
}

const PROGRESS_AWARDS = Object.freeze({
  statueKeyRevealed: 5,
  frontDoorOpened: 5,
  wellLooted: 5,
  cellarOpened: 5,
  libraryPassageOpened: 5,
  diaryDecoded: 5,
  safeRevealed: 5,
  safeOpened: 5,
  wallGapFound: 5,
  betweenWalls: 20,
  musicBoxOpened: 5,
  jewelryBoxOpened: 5,
  wraithPassed: 5,
  oakPanelAligned: 5,
  trollRiddleSolved: 5,
  reliquarySealed: 5,
  bellRung: 5,
  secretDoorOpened: 5,
  burritoSurvived: 25,
  selfFireSurvived: 10,
});
const STANDALONE_MAX_AWARDS = Object.freeze({
  milk: 5,
  obsidianEye: 15,
  brazier: 30,
  dreadmaw: 10,
  silverMirror: 30,
});

function awardProgress(ctx, id) {
  const points = PROGRESS_AWARDS[id];
  const flag = `progressAward:${id}`;
  if (!points || ctx.getFlag(flag)) return 0;
  ctx.setFlag(flag);
  ctx.addScore(points);
  return points;
}

function awardSuffix(points) {
  return points ? ` (+${points})` : "";
}

function maximumScore(ctx) {
  const itemPoints = Object.values(ctx.world.items)
    .filter((item) => item.treasure)
    .reduce((total, item) => total + (item.points || 0), 0);
  const pickupPoints = Object.values(ctx.world.items)
    .reduce((total, item) => total + (item.progressPoints || 0), 0);
  const progressionPoints = Object.values(PROGRESS_AWARDS)
    .reduce((total, points) => total + points, 0);
  const standalonePoints = Object.values(STANDALONE_MAX_AWARDS)
    .reduce((total, points) => total + points, 0);
  return itemPoints + pickupPoints + progressionPoints + standalonePoints;
}

function superUser(ctx, argString) {
  const trimmed = (argString || "").trim();
  const [subRaw, ...restParts] = trimmed.split(/\s+/);
  const sub = (subRaw || "").toLowerCase();
  const rest = restParts.join(" ");

  if (!sub || sub === "help" || sub === "?") return suWrap(SU_HELP);

  switch (sub) {
    case "rooms": {
      const ids = Object.keys(ctx.world.rooms);
      const lines = ids.map((id) => `  ${id.padEnd(20)}${ctx.world.rooms[id].name}`);
      return suWrap(`[su] ${ids.length} rooms:\n` + lines.join("\n"));
    }
    case "goto": case "go": case "tp": case "jump": case "room": case "warp": {
      const id = suResolveRoom(ctx, rest);
      if (!id) return suWrap(`[su] no room matches "${rest}". Try: su rooms`);
      ctx.state.room = id;
      ctx.setFlag("seen:" + id, true);
      const view = ctx.isLit()
        ? ctx.describeRoom(true)
        : `${ctx.world.rooms[id].name.toUpperCase()}\n(It's pitch dark here — type 'su light' to see it.)`;
      return `[su] teleported to ${id}.\n\n${view}`;
    }
    case "where": case "here": {
      const id = ctx.state.room;
      const room = ctx.world.rooms[id];
      const exitLines = Object.entries(room.exits || {}).map(([dir, ex]) => {
        if (typeof ex === "string") return `    ${dir} -> ${ex}`;
        const bits = [];
        if (ex.via) bits.push(`via ${ex.via}`);
        if (ex.revealedBy) bits.push(`revealedBy ${ex.revealedBy}`);
        if (ex.locked) bits.push("locked");
        return `    ${dir} -> ${ex.to}${bits.length ? "  (" + bits.join(", ") + ")" : ""}`;
      });
      const extra = typeof room.extraDirections === "function"
        ? room.extraDirections(ctx) : (room.extraDirections || []);
      const items = ctx.itemsIn(id).map((i) => `    ${i.id}${i.scenery ? " (scenery)" : ""}`);
      return suWrap(
        `[su] room: ${id} — ${room.name}\n` +
        `  dark: ${!!room.dark}   lit now: ${ctx.isLit()}\n` +
        `  exits:\n${exitLines.join("\n") || "    (none)"}\n` +
        (extra.length ? `  extraDirections: ${extra.join(", ")}\n` : "") +
        `  items here:\n${items.join("\n") || "    (none)"}`);
    }
    case "map": case "fullmap": case "reveal": {
      for (const id of Object.keys(ctx.world.rooms)) ctx.setFlag("seen:" + id, true);
      ctx.setFlag("usedMap", true);
      return renderMap(ctx);
    }
    case "items": case "loot": {
      const lines = Object.keys(ctx.world.items).map((id) => {
        const def = ctx.world.items[id];
        const loc = ctx.roomOf(id);
        const tags = [def.treasure && "treasure", def.worn && "worn"]
          .filter(Boolean).join(",");
        return `  ${id.padEnd(18)}@ ${String(loc)}${tags ? "  [" + tags + "]" : ""}`;
      });
      return suWrap(`[su] ${lines.length} items:\n` + lines.join("\n"));
    }
    case "give": case "get": case "spawn": {
      if (/^(all|everything)$/i.test(rest)) {
        let count = 0;
        for (const [id, definition] of Object.entries(ctx.world.items)) {
          if (!definition.takeable) continue;
          ctx.moveItem(id, "inventory");
          if (ctx.item(id)) ctx.item(id).worn = false;
          count++;
        }
        return `[su] ${count} portable items are now in your inventory.`;
      }
      const id = suResolveItem(ctx, rest);
      if (!id) return suWrap(`[su] no item matches "${rest}". Try: su items`);
      ctx.moveItem(id, "inventory");
      if (ctx.item(id)) ctx.item(id).worn = false;
      return `[su] ${id} is now in your inventory.`;
    }
    case "equip": case "wear": case "powerup": {
      const preferred = [
        "backpack", "headlamp", "xrayGoggles", "wingedShoes",
        "talisman", "rubyRing", "obsidianEye",
      ];
      const equipped = [];
      for (const id of preferred) {
        const item = ctx.item(id);
        if (!item || item.loc !== "inventory") continue;
        item.worn = true;
        if (item.activatesOnWear && (item.fuel == null || item.fuel > 0)) item.lit = true;
        equipped.push(id);
      }
      return `[su] equipped: ${equipped.join(", ") || "(nothing)"}.`;
    }
    case "fill": case "reliquary": case "deposit": {
      const requiredOnly = /^(required|minimum|min)$/i.test(rest);
      let n = 0, pts = 0;
      for (const id of Object.keys(ctx.world.items)) {
        const def = ctx.world.items[id];
        const selected = def.treasure;
        if (selected && ctx.roomOf(id) !== "reliquary") {
          ctx.moveItem(id, "reliquary");
          ctx.addScore(def.points || 0);
          pts += def.points || 0;
          n++;
        }
      }
      ctx.setFlag("curseLiftable");
      if (!requiredOnly) ctx.setFlag("floorDoorOpen");
      return requiredOnly
        ? `[su] deposited ${n} required heirloom(s) (+${pts}). The BELL is ready.`
        : `[su] deposited ${n} treasure(s) (+${pts}). The BELL is ready and the floor STAIRCASE is open.\n` +
          "Go to the ROYAL HALL, then RING BELL (dawn ending) or go DOWN (Gary ending).";
    }
    case "win": case "dawn": {
      ctx.setFlag("seen:hollowSanctum", true);
      ctx.state.room = "hollowSanctum";
      return ctx.win("[su] Fast-forwarded to the dawn ending.");
    }
    case "gary": case "end": case "badending": case "cliffhanger": {
      ctx.setFlag("floorDoorOpen");
      ctx.state.room = "garysLair";
      return garyEnding(ctx);
    }
    case "light": case "sight": {
      const on = !ctx.getFlag("__suSight");
      ctx.setFlag("__suSight", on);
      return `[su] see-in-the-dark ${on ? "ON" : "OFF"}.`;
    }
    case "god": case "invincible": case "noclip": {
      const on = !ctx.getFlag("__godmode");
      ctx.setFlag("__godmode", on);
      return `[su] god mode ${on ? "ON — you'll survive things that would kill you" : "OFF"}.`;
    }
    case "heal": case "cure": case "sober": {
      ctx.setFlag("onFire", false);
      ctx.setFlag("burnTurns", 0);
      ctx.setFlag("sick", 0);
      ctx.setFlag("high", 0);
      ctx.setFlag("digestivePhase", null);
      return "[su] cleared fire, sickness, and the trip.";
    }
    case "score": {
      const n = parseInt(rest, 10);
      if (Number.isNaN(n)) return suWrap("[su] usage: su score <number>");
      ctx.state.score = n;
      return `[su] score set to ${n}.`;
    }
    case "maxscore": case "max": {
      const score = maximumScore(ctx);
      ctx.state.score = score;
      return `[su] score set to the deterministic pre-ending maximum: ${score}.`;
    }
    case "flags": case "state": {
      const flags = ctx.state.flags;
      const lines = Object.keys(flags)
        .filter((k) => !k.startsWith("seen:"))
        .sort()
        .map((k) => `  ${k} = ${JSON.stringify(flags[k])}`);
      return suWrap("[su] flags (seen:* hidden):\n" + (lines.join("\n") || "  (none)"));
    }
    default:
      return suWrap(`[su] unknown command "${sub}".\n\n` + SU_HELP);
  }
}

// --- The Blackwood Manor Hint Line (1-900-BLACKWOOD, 99c/min) -----------------
// Gary: underpaid, starving, furious — but his hints are genuinely useful.
// Returns the single most relevant next-step hint for the current game state.
function nextHint(ctx) {
  const dep = (id) => ctx.roomOf(id) === "reliquary";
  const inside = ctx.getFlag("frontDoorOpen");
  const candle = ctx.item("candlestick");
  const lit = candle && candle.lit;

  if (!inside) {
    if (ctx.getFlag("statueMoved") || ctx.has("frontKey") || ctx.roomOf("frontKey") === "garden") {
      return "You've got the iron key — or it's sitting right there in the garden. TAKE it, go to the PORCH, then UNLOCK DOOR WITH IRON KEY, OPEN DOOR, and go NORTH. That's the entire trick.";
    }
    return "The front door's locked, shocker. Some genius buried the key under that leaning STATUE in the garden. MOVE the statue, grab the key, then unlock the front door. In you go. Riveting.";
  }
  if (!lit) {
    if (ctx.roomOf("matches") === null) {
      return "You burned your only match already, didn't you. DIDN'T YOU. The CANDLESTICK is still in the DINING ROOM, " +
        "but without that match it is now an extremely expensive paperweight. Next time don't waste the match, pal.";
    }
    return "You want to survive downstairs? TAKE the CANDLESTICK (dining room) and the MATCHES (kitchen), then LIGHT CANDLE. You get exactly ONE match. Try to rise to the occasion.";
  }
  if (!dep("rubyRing")) {
    return "The BLACKWOOD BLOODSIGNET is locked in a jewelry box in the GRAND BEDROOM. The little key's inside the MUSIC BOX in the NURSERY — OPEN the music box, take the tiny key, then UNLOCK JEWELRY BOX WITH TINY KEY.";
  }
  if (!dep("musicBox")) {
    return "Don't leave the JEWELED MUSIC BOX behind — the box ITSELF is a Blackwood heirloom, not just the tiny key's shell. Once you've got the tiny key out, TAKE the music box and PUT it in the RELIQUARY too.";
  }
  if (!dep("ancientCoin")) {
    return ctx.has("rope")
      ? "You've got the rope, congratulations. Go to the garden and ENTER WELL — or just go DOWN. Coin's at the bottom. Try not to end up down there permanently."
      : "There's a coin down the garden WELL. Go down without a ROPE and you SPLATTER — dead, instantly, no do-overs. There's a rope in the KITCHEN. Get it FIRST. I cannot stress this enough.";
  }
  if (!dep("grimoire")) {
    return "In the LIBRARY there's a brass LEVER where a book should be. PULL it — a bookcase swings open onto a stair DOWN to a hidden chamber. The grimoire's there. Bring your lit candle; it's black as pitch.";
  }
  if (!dep("crystalDecanter")) {
    return "Crystal decanter's in the WINE CELLAR. OPEN the CELLAR trap-door in the KITCHEN, go DOWN. Pitch dark — candle had better be lit or you're a grue's dinner. Unlike me, who has eaten NOTHING.";
  }
  if (!dep("ancestralPortrait")) {
    return "There's an ANCESTRAL PORTRAIT in the ATTIC. PULL the CORD on the LANDING to drop the ladder. But that ladder's rotten — climb it carrying more than a couple things and you crash through and DIE. DROP your junk on the landing first.";
  }
  if (!dep("goldLocket")) {
    return "The gold locket's in the CRYPT, past the WINE CELLAR — guarded by a WRAITH that kills you on sight. So: READ the DIARY in the STUDY for the safe combo, MOVE the PROFILE PAINTING in the PARLOR, OPEN the SAFE, take the TALISMAN, WEAR it, THEN walk into the CRYPT. In that order. Write it down.";
  }
  if (!dep("talisman")) {
    return "The TALISMAN that protected you from the WRAITH bears the BM crest on its back. Once the GOLD LOCKET " +
      "is safely recovered, REMOVE TALISMAN and PUT it in the RELIQUARY as another family heirloom.";
  }
  if (!dep("familyRing")) {
    return "You missed the dusty BLACKWOOD FAMILY RING marked BM in an abandoned ore cart in the DRAGON CAVE ANTECHAMBER. TAKE it and PUT it in the RELIQUARY.";
  }
  if (!dep("familyCrest")) {
    if (!ctx.getFlag("dragonMoved")) {
      return "A family heirloom, the BLACKWOOD FAMILY CREST, waits in DREADMAW'S VAULT. Bring the kitchen APPLE through the HEDGE MAZE and OFFER APPLE TO DRAGON.";
    }
    if (!ctx.getFlag("dragonVaultOpen")) {
      return "Follow DREADMAW'S cave through the ANTECHAMBER and MINING GALLERY. WEAR the HEADLAMP, go DOWN, TAKE the BACKPACK in the DEEP SHAFT, then TALK TO TROLL at the TROLL GATE.";
    }
    return "The VAULT is open. TAKE the BLACKWOOD FAMILY CREST and PUT it in the RELIQUARY.";
  }
  if (!dep("spyglass")) {
    if (!ctx.getFlag("brazierLit")) {
      return "The missing GEM for the GREAT OAK'S PANEL is hidden in the GARDEN BRAZIER. A lone match is too brief: carry a LIT CANDLESTICK and LIGHT BRAZIER, or LIGHT YOURSELF ON FIRE first.";
    }
    if (!ctx.getFlag("oakLightAligned")) {
      return "TAKE the EMERALD GEM, then follow the path EAST through the PRIVY to the GREAT OAK. EXAMINE the PANEL and PLACE the gems into its BOTTOM, MIDDLE, and TOP SLOTS until the mirrored sunlight converges.";
    }
    if (ctx.roomOf("spyglass") === "treeFort") {
      return "The oak's PLATFORM alternates between the roots and TREE FORT. ENTER PLATFORM while it's beside you, WAIT for it to rise, then TAKE the BM SPYGLASS.";
    }
    return "The BM SPYGLASS from the TREE FORT is the heirloom. PUT SPYGLASS IN RELIQUARY.";
  }
  if (!dep("candlestick")) {
    return "Home stretch. Once every dark room's cleared, the candlestick itself is a treasure — PUT it in the RELIQUARY last. You won't need light in the lit hall.";
  }
  if (!dep("backwardsWatch")) {
    if (!ctx.getFlag("wallGapFound")) {
      return "The NURSERY'S loose WALLPAPER hides a crawl-gap. PULL WALLPAPER, go IN, and TAKE the " +
        "BACKWARDS WATCH bearing a Blackwood family inscription.";
    }
    if (ctx.roomOf("backwardsWatch") === "betweenWalls") {
      return "Go IN through the NURSERY wall-gap and TAKE the BACKWARDS WATCH. The inscription on its back " +
        "makes it a family heirloom, however badly time behaves around it.";
    }
    return "The BACKWARDS WATCH is a Blackwood heirloom now, not pocket clutter. PUT WATCH IN RELIQUARY.";
  }
  if (!allTreasuresDeposited(ctx)) {
    return "You've FOUND the loot — now actually PUT each heirloom in the RELIQUARY in the ROYAL HALL. They're worth nothing rattling around in your pockets.";
  }
  return "Everything's in the reliquary. CLOSE RELIQUARY, then RING THE BELL in the hall. And then — I mean this warmly — never call me again.";
}

function cycleFlavor(ctx, poolName) {
  const pool = CYCLING_FLAVOR_POOLS[poolName];
  if (!pool || pool.length !== 12) {
    throw new Error(`Cycling flavor pool "${poolName}" must contain exactly 12 entries.`);
  }
  const flag = `flavorCycle:${poolName}`;
  const index = Number(ctx.getFlag(flag)) || 0;
  ctx.setFlag(flag, (index + 1) % pool.length);
  return pool[index % pool.length];
}

// Random hunger interruptions — Gary is starving and keeps getting distracted.
// Spliced into the MIDDLE of a hint (~45% of calls) so the real advice still lands.
const HUNGER = [
  "*stomach growls, loud and mournful, right into the receiver*",
  "— hang on, someone left half a sandwich in the break room — ...no. That's a stapler. Cruel.",
  "— sorry, what was I— DENISE did you order pizza? ...no? Okay. Okay. Where was I.",
  "*chewing something that is very much not food* ...mm. Anyway.",
  "— gimme a sec, I'm gonna gnaw on this pencil, it's the closest thing to a meal I've got —",
  "— the vending machine ate my last quarter and the B4 is STUCK. I can SEE the chips. I can SEE them —",
  "*distant microwave beeping* THAT IS NOT MINE. Someone's Hot Pocket is done and it is NOT MINE. Ahem.",
  "— hold on, is that— *sniff* — no, that's the printer toner. I'd eat it. I won't. But I'd think about it.",
  "— I found a cracker in my desk. The date on it is from a different presidential administration —",
  "*wrapper crinkles* False alarm. Empty mustard packet. Still considering it.",
  "— Denise reheated fish in the break room and somehow that made being hungry WORSE —",
  "*long pause* Sorry. I was watching a moth circle the snack machine. Lucky little guy.",
];

function injectHunger(ctx, hint) {
  if (Math.random() > 0.45) return hint; // ~45% of the time he loses it
  const aside = cycleFlavor(ctx, "hunger");
  const idx = hint.indexOf(". ");
  if (idx === -1) return hint + "\n\n" + aside;
  // Splice the hunger aside between the first sentence and the rest of the hint.
  return hint.slice(0, idx + 1) + "\n\n" + aside + "\n\n...right. " + hint.slice(idx + 2);
}

// Grumpy greeting variants when you first dial in.
const INTROS = [
  "*click* Blackwood Manor Hint Line, ninety-nine cents a minute, this is Gary, what.",
  "Yeah — Gary again. I can see it's the same number calling back, you know.",
  "*chewing* ...hrmf. Hint Line. Gary. Make it fast, my Hot Pocket's going cold.",
  "Oh good, it's you. My favorite caller. That was sarcasm. Whaddya want.",
  "Gary. I've been on this headset since noon and eaten one (1) vending-machine Danish.",
  "*muffled* — I'M ON A CALL, DENISE — ...yeah. Hint Line. Go ahead. Thrill me.",
  "*click* Gary speaking. Against my better judgment and the terms of my lunch break.",
  "Blackwood Manor Hint Line. You have questions; I have low blood sugar. Let's trade.",
  "Gary here. The headset is damp, the coffee is cold, and somehow you're still the emergency.",
  "*paper bag rustling* Hint Line. No, that wasn't food. It was the hope of food.",
  "You've reached Gary at Blackwood Manor support. Support is a generous word. Start talking.",
  "*click* Same haunted house, same underpaid man. What broke this time?",
];
const DEFLECT = [
  "I don't know what that means, and frankly I lack the energy to care.",
  "Is that a question? It sounded like a question. I'm choosing to ignore it.",
  "Pal, I answer a phone in the dark for pennies. I'm not a philosopher.",
  "*static* ...what? Sorry, I was thinking about lunch. I'm always thinking about lunch.",
  "Cool. Riveting. Anyway.",
  "I followed maybe half of that, and the half I followed has made things worse.",
  "That's certainly a collection of words. Try HINT if you'd like one with a purpose.",
  "I have no response prepared for whatever that was. Management really failed us both.",
  "Could you put that thought back where you found it and ask me about the house?",
  "I'm writing that down under 'not remotely my department.'",
  "The meter understood you. I did not.",
  "Sure. Absolutely. Meaning has left the building, but sure.",
];
const SIGNOFF = [
  "Finally.",
  "Yeah, yeah — don't call back.",
  "Oh thank GOD.",
  "Go. Be free. Leave me to my hunger.",
  "Great talk. Truly. *an eye-roll you can somehow hear*",
  "And there goes my only caller. Tragic. Peaceful, but tragic.",
  "Goodbye. May your next bad decision be someone else's shift.",
  "Fine. Hang up before the meter develops another digit.",
  "We're done? Beautiful. I can hear the fluorescent lights again.",
  "Go haunt somebody who gets dental.",
  "Call ended. My evening improves by measurable degrees.",
  "Right. Bye. Tell the grue I said absolutely nothing.",
];

function bumpBill(ctx) { ctx.setFlag("phoneBill", (ctx.getFlag("phoneBill") || 0) + 99); }
function meter(ctx) { return "Meter's at $" + (((ctx.getFlag("phoneBill") || 0)) / 100).toFixed(2) + "."; }

// Gary needles you as the bill climbs — each milestone fires once.
const BILL_MILESTONES = [
  [500, "...that's five bucks, by the way. Five. On a hint line. In this economy."],
  [1000, "Ten dollars. TEN. You could've bought me lunch. SEVERAL lunches. But no."],
  [2000, "Twenty bucks — you're officially my biggest caller today. Congratulations, I guess."],
  [3500, "Thirty-five dollars. That's a whole hour of my wages, you magnificent disaster."],
  [5000, "Fifty. DOLLARS. You are, without question, the worst caller I have ever had. I'm weirdly proud. Now HANG UP."],
];
function billAside(ctx) {
  const bill = ctx.getFlag("phoneBill") || 0;
  let tier = ctx.getFlag("billTier") || 0;
  let msg = "";
  for (let i = 0; i < BILL_MILESTONES.length; i++) {
    if (bill >= BILL_MILESTONES[i][0] && i + 1 > tier) { msg = BILL_MILESTONES[i][1]; tier = i + 1; }
  }
  ctx.setFlag("billTier", tier);
  return msg ? "\n\n" + msg : "";
}

// Hall-of-shame rank for the end screen, based on total phone bill (cents).
function phoneRank(cents) {
  const d = "$" + (cents / 100).toFixed(2);
  if (cents >= 5000) return `\nHall of Shame: "Gary's Worst Caller of All Time" (${d}). He'll be telling this story for years.`;
  if (cents >= 3000) return `\nHall of Shame: "Single-Handedly Funding the Hint Line" (${d}).`;
  if (cents >= 1500) return `\nHall of Shame: "Gary's Best Customer" (${d}).`;
  if (cents >= 500) return `\nHall of Shame: "Chatty" (${d}).`;
  return `\nHall of Shame: "Frugal" (${d}). Gary barely remembers you.`;
}

// ---------- Gary's arc: the Hint Line slowly becomes a therapy line ----------
// Driven by garyXP — every dial-in and every exchange nudges it up.
function bumpXP(ctx) { ctx.setFlag("garyXP", (ctx.getFlag("garyXP") || 0) + 1); }
function garyStage(ctx) {
  const xp = ctx.getFlag("garyXP") || 0;
  if (xp < 4) return 0;   // grumpy hint-line guy
  if (xp < 9) return 1;   // cracking / oversharing
  if (xp < 16) return 2;  // reluctant therapist
  return 3;               // full therapist
}
function stagePick(ctx, arr) { return arr[Math.min(garyStage(ctx), arr.length - 1)]; }
// The mechanical tail appended to every conversational line: the meter, any
// one-shot bill milestone, and the mood aside. Captured here so the optional LLM
// voice layer can replace Gary's WORDS while keeping the tail intact — billAside
// has a one-shot side effect, so dropping it would silently eat a milestone.
let lastSayTail = "";
function say(ctx, arr) {
  const tail = " " + meter(ctx) + billAside(ctx) + garyAside(ctx);
  lastSayTail = tail;
  const selected = stagePick(ctx, arr);
  return (typeof selected === "function" ? selected() : selected) + tail;
}

const STAGE_INTROS = [
  INTROS,
  [
    "Blackwood Hint Line, Gary... oh. You again. You know you're the most human contact I get all shift? That's not a compliment. What.",
    "*sigh* Hint Line. Gary. Honestly? Kind of glad it's you. Don't read into that. Whaddya need.",
    "Gary here. Long night. Long life. ...anyway. The house. Right. Go ahead.",
    "Hint Line, Gary speaking. I recognized your ring. That's either sweet or a workplace injury.",
    "Oh, hey. You made it another few rooms. I mean— obviously you called for professional expertise. Proceed.",
    "*click* Gary. I was wondering if you'd call again. In a strictly billing-related way.",
    "Blackwood support. It's Gary. The night got quieter after you hung up, which was somehow worse.",
    "Gary here. I saved your place on the complaint form. And maybe in my thoughts. Forget that second part.",
    "You again. Good. I mean, fine. I mean the line is open. Talk.",
    "*chair squeaks* Hint Line. I was not asleep; I was resting my employment.",
    "Gary speaking. I made fresh coffee and immediately regretted the word fresh.",
    "Hey. It's Gary. Let's deal with your haunted-house problem before either of us develops a new one.",
  ],
  [
    "Blackwood Cris— Hint Line. Gary. Sit down. Metaphorically. Tell me what's going on — with the house, and, y'know, in general.",
    "Gary. Deep breath. We'll get to the mansion. First: how are you carrying all this? ...Fine. What do you need.",
    "Hint Line, this is Gary, and I've been thinking a lot about us. Professionally. What's on your mind.",
    "Gary here. Before we discuss doors, let's notice which ones you keep expecting to be locked.",
    "*click* Welcome back. Take one breath for the manor and one for whatever else followed you in.",
    "Blackwood Hint Line. Gary speaking. I have a pen now, so apparently this is becoming a practice.",
    "You reached Gary. Tell me where you're stuck, and try not to edit out how that feels.",
    "Gary here. No judgment, except about entering dark cellars without a lamp. Some judgment there.",
    "Hint Line. Let's separate the immediate ghost problem from the larger pattern. Ghost first.",
    "*paper shuffles* I made notes. Mostly arrows and the word 'boundaries,' but they're notes.",
    "Gary speaking. Start with the room you're in. We can work outward from there.",
    "Welcome back. I can't fix the manor for you, but I can stay on the line while you name the next step.",
  ],
  [
    "Blackwood Manor Wellness Line, this is Gary, licensed by absolutely no one. Breathe with me. We'll get to the house. First — how are you, really?",
    "Gary. This is a safe space. Ninety-nine cents a minute, but safe. Tell me everything. Start with the house if it's easier.",
    "Welcome back. I kept your chart. *shuffles a napkin* Now — where were we with your fear of locked doors?",
    "Blackwood Wellness Line, Gary speaking. Feet on the floor, unless you're wearing the winged shoes.",
    "Gary here. I lit a candle for the session. Human Resources says I absolutely did not.",
    "Welcome back. Your chart says 'resourceful, avoidant, carrying too many cursed objects.' Accurate?",
    "*calm inhale* This is Gary. Name the room, name the feeling, then name the obvious exit.",
    "You've reached the wellness annex of the Hint Line, which is still just my cubicle with a fern.",
    "Gary speaking. Whatever the house is doing, you don't have to match its energy.",
    "Welcome. The meter is running, but we are not rushing. Those are different systems.",
    "Blackwood Wellness Line. Let's approach the locked door with curiosity and, if available, the correct key.",
    "Gary here. I have your napkin-chart and a fresh pen. One of us is making progress.",
  ],
];

const THERAPY_ASIDES = [
  "...and how does that make you feel?",
  "Mm. Go on. I'm hearing a lot underneath that.",
  "The house is a metaphor. You know that, right? It's okay if you don't. Yet.",
  "Notice you reached for the answer instead of sitting with the discomfort.",
  "There's no wrong way to feel about a grue. Except denial.",
  "Let's name the feeling. Is it fear — or is it just Tuesday?",
  "Where do you feel that in your body, besides directly behind the sternum where the wraith hit you?",
  "You don't have to solve the whole manor right now. Just the next locked container.",
  "I'm noticing a pattern of taking cursed objects before asking what they do.",
  "Let's hold two truths: the house is hostile, and you keep walking deeper into it.",
  "What would it look like to choose the exit that isn't obviously full of teeth?",
  "Breathe in. Breathe out. Keep the candle lit while doing both.",
];
function garyAside(ctx) {
  if (Math.random() > 0.4) return "";
  const poolName = garyStage(ctx) >= 2 ? "therapyAsides" : "hunger";
  return "\n\n" + cycleFlavor(ctx, poolName);
}

// Is the caller properly lost? Deterministic, never model-decided: if they ask
// for another hint without having scored since the last one, they're spinning.
// Two hints with nothing to show for it and Gary offers the map.
const STUCK_HINTS = 2;
function noteStuck(ctx) {
  const prev = ctx.getFlag("scoreAtLastHint");
  const streak = ctx.getFlag("stuckStreak") || 0;
  ctx.setFlag("stuckStreak", prev === undefined || ctx.state.score > prev ? 0 : streak + 1);
  ctx.setFlag("scoreAtLastHint", ctx.state.score);
  return (ctx.getFlag("stuckStreak") || 0) >= STUCK_HINTS;
}

// Gary's map offer. Once he's mentioned it he doesn't nag about it again.
function mapOffer(ctx) {
  if (ctx.getFlag("usedMap") || ctx.getFlag("mapOffered")) return "";
  ctx.setFlag("mapOffered", true);
  return "\n\nOkay, you're properly lost, aren't you. Look — third shift, nothing to do, " +
    "I sketched the whole house out on the back of a placemat. Type MAP and I'll read it to you. " +
    "It's not pretty. Neither am I.";
}

// Wrap the real hint in stage-appropriate framing — the clue is ALWAYS delivered.
function frameHint(ctx, hint) {
  const stuck = noteStuck(ctx);
  const offer = stuck && !ctx.getFlag("onFire") ? mapOffer(ctx) : "";
  return frameHintText(ctx, hint) + offer;
}

function frameHintText(ctx, hint) {
  switch (garyStage(ctx)) {
    case 0: return injectHunger(ctx, hint);
    case 1: return hint + "\n\n(...sorry. Long night. Ignore me.)";
    case 2: return "Sure. The answer: " + hint +
      "\n\nBut notice you came to ME for it. What does needing help stir up in you? We can explore that.";
    default: return "Let's not rush to solutions... okay, okay: " + hint +
      "\n\nThough the thing you're stuck on isn't really about the mansion, is it. We both know that. I'll note it on your chart.";
  }
}

const SIGNOFF_STAGE = [
  SIGNOFF,
  ["Take care of yourself out there. ...I mean it. Weird.",
   "Go on. I'll be here. I'm always here.",
   "Bye. Don't be a stranger. Actually — do. I need the quiet. No. Come back.",
   "All right. Be careful. That's an instruction, not concern. Mostly.",
   "Go do the thing. Call back if it becomes a different, worse thing.",
   "Okay. I'm hanging up first so this doesn't become emotionally significant.",
   "Later. I hope the next room is less awful than the last one.",
   "Goodbye. I will absolutely not wonder whether you made it.",
   "You've got a plan. That's more than either of us had five minutes ago.",
   "Go on, then. The line will still be here. So will I, apparently.",
   "*soft click* ...No, I didn't say anything after goodbye.",
   "Right. Call over. Don't make me regret being almost helpful."],
  ["Our time's up for today. Notice how that lands. *click*",
   "You made progress. I answered a phone. We both grew. Bye.",
   "Let's pause here. Not because the meter scares me. Because endings matter.",
   "Take that next step without me. Autonomy looks good on you.",
   "We'll stop there. Sit with what you learned, preferably somewhere without a grue.",
   "You have enough for now. More advice would just become avoidance.",
   "Go practice choosing a direction before calling someone to choose it for you.",
   "I'm ending the session, not abandoning you. There is an important billing distinction.",
   "Carry the insight, leave the cursed furniture.",
   "We'll pick this up next time, assuming the house doesn't pick you up first.",
   "That feels like a natural stopping point. The unnatural ones usually have teeth.",
   "Good work today. I resent how sincerely I mean that."],
  ["Session complete. Be gentle with yourself in that house — you're braver than the grue gives you credit for. *click*",
   "Go. The only way out is through. Also, north. *click*",
   "We'll end here. Trust your instincts, except the one that says to lick the reliquary.",
   "Take what serves you from this session. Leave ninety-nine cents per minute.",
   "You know your next step. Give yourself permission to take it badly.",
   "Goodbye for now. The manor is not your story's final room.",
   "Our work continues, but this call does not. Boundaries. *click*",
   "Walk gently, carry light, and stop setting yourself on fire unless the puzzle demands it.",
   "Session over. Remember: fear is information, not a compass direction.",
   "Go meet the house as you are. Armed, ideally.",
   "We'll stop before this becomes dependency. Call again when it becomes healthy interdependence.",
   "You did enough for one call. Let the next turn belong to you."],
];

// Gary comments on your condition the moment he picks up, before anything
// else — he can hear it. Fire has its own full greeting override (below);
// sick/high just get a one-line aside stitched onto the normal intro.
function conditionAside(ctx) {
  if (ctx.getFlag("onFire")) return ""; // fireGreeting takes over entirely
  if ((ctx.getFlag("sick") || 0) > 0)
    return "Oh my GOD — is that BARF I smell? You reek like a dumpster that ate a burrito and " +
      "regretted it, deeply. Please, for both our sakes, find a TOILET.\n\n";
  if ((ctx.getFlag("high") || 0) > 0)
    return "...you're tripping balls right now, aren't you. I can hear it in your voice. Please " +
      "don't pet anything that isn't there.\n\n";
  return "";
}

// First contact when you CALL / DIAL / HINT — greets, gives one real hint, and
// leaves the line OPEN so you can actually talk to him (see hotlineTalk).
function hotline(ctx) {
  const n = (ctx.getFlag("hotlineCalls") || 0) + 1;
  ctx.setFlag("hotlineCalls", n);
  bumpXP(ctx);
  bumpBill(ctx);
  ctx.addScore(-2); // dialing in isn't free, pal
  if (ctx.getFlag("onFire")) return fireGreeting(ctx);
  const aside = conditionAside(ctx);
  const intro = cycleFlavor(ctx, `stageIntros${garyStage(ctx)}`);
  const tail = garyStage(ctx) >= 2
    ? `(You're in session. Say HINT for a clue, ask Gary anything, or HANG UP. ${meter(ctx)})`
    : `(You're on the line. Ask him things, say HINT for another clue, or HANG UP when you're done. ${meter(ctx)})`;
  return `${aside}${intro}\n\n${frameHint(ctx, nextHint(ctx))}\n\n${tail}`;
}

// While you're on the line, everything you type is routed here (core.send).
function hotlineTalk(ctx, text) {
  const t = (text || "").trim().toLowerCase();

  // Gary's later stages are a joke about a burnt-out man playing therapist.
  // A real person typing real despair into that box is not a joke. Handle it
  // deterministically, BEFORE the meter runs and before any model sees it:
  // no billing, no snark, no character, no dependence on an LLM being present.
  if (CRISIS.test(t)) {
    ctx.setFlag("onCall", false);
    return "Gary is quiet for a moment. Then the bit drops out of his voice entirely.\n\n" +
      "\"Hey. I'm a made-up guy in a game about a haunted house, so I'm the wrong person " +
      "for this — but I'm not going to pretend I didn't hear it. Please say it out loud to " +
      "someone real. In the US you can call or text 988, any hour. Anywhere else, a " +
      "friend, a doctor, an emergency line. I'm not charging you for this call.\"\n\n" +
      "*click*";
  }

  bumpBill(ctx); // the meter runs whether you're getting help or just chatting
  bumpXP(ctx);   // and every exchange nudges Gary further along his arc

  if (/\b(hang\s*up|hangup|good\s*bye|bye|later|never\s*mind|nevermind|leave|go away)\b/.test(t) || /i'?m done/.test(t)) {
    ctx.setFlag("onCall", false);
    const signoff = cycleFlavor(ctx, `signoffs${garyStage(ctx)}`);
    return signoff + " " + meter(ctx) + billAside(ctx) + " *click*";
  }
  if (ctx.getFlag("onFire")) return fireCallTalk(ctx, t);
  if (/\b(shut up|screw you|stupid|idiot|jerk|rude|hate you|loser|dumb|useless)\b/.test(t)) {
    const rc = (ctx.getFlag("hotlineRude") || 0) + 1;
    ctx.setFlag("hotlineRude", rc);
    if (rc >= 2) {
      ctx.setFlag("onCall", false);
      return garyStage(ctx) >= 2
        ? "I hear you. And I'm setting a boundary: I'm ending our session. Sit with that. *click*"
        : "Yeah? I don't get paid enough to be talked to like that. Figure it out yourself. *SLAM* *click*";
    }
    return say(ctx, [
      "Wow. WOW. I'm a person — a hungry, underpaid person. One more crack like that and I hang up.",
      "Ouch. You know, that says more about you than me. One more and I'm gone.",
      "I hear anger. Anger's just fear in a leather jacket. But I have boundaries now — try that again.",
      "That lands as projection, and I forgive you. But let's not, okay? Let's not.",
    ]);
  }
  // MAP works on the line too — Gary told you to type it, so it had better work.
  // He reads his placemat sketch down the phone at you.
  if (/^(map|map mode|m)$/.test(t) || /\b(show|read|send|fax) (me )?(the )?map\b/.test(t)) {
    ctx.setFlag("usedMap", true);
    return say(ctx, [
      "Hang on, I've got it here somewhere... okay. Picture this. I'm holding up a placemat.",
      "*paper rustling* Right. This is the placemat. You can't see it, so I'll describe it. Slowly. At ninety-nine cents a minute.",
      "Okay. Reading you my sketch. Don't judge the handwriting, I did this with a golf pencil.",
    ]) + "\n\n" + renderMap(ctx);
  }
  if (/\b(hint|help|stuck|clue|next|where|advice|tip)\b/.test(t) || /how (do|to|the heck|am i)/.test(t) || /what.*(do|now|next)/.test(t)) {
    ctx.addScore(-1);
    return frameHint(ctx, nextHint(ctx)) + "\n\n" + meter(ctx) + billAside(ctx);
  }
  if (/\b(who|you gary)\b/.test(t) || /(your|whats|what'?s) name/.test(t)) {
    return say(ctx, [
      "Gary. I answer phones for a haunted house I've never set foot in and never will. That's the whole bio.",
      "Gary. Just Gary. Some nights that feels like a lot to carry.",
      "Gary. Hint-line operator, reluctantly. Listener, increasingly. It's a journey.",
      "Gary. Healer. Trapped man. The name matters less than the work we do here, honestly.",
    ]);
  }
  if (/\b(pay|paid|wage|salary|money|rich|cost|charge|expensive|cheap|make|makes|earn|afford|worth)\b/.test(t)) {
    return say(ctx, [
      "Three thirty-five an hour. You pay ninety-nine cents a minute; I see none of it. Beautiful system — for someone. Not me.",
      "Three thirty-five an hour. ...I've stopped doing the math. It doesn't help.",
      "Money, sure. But money's often how we dodge the harder conversation. What are we really asking about?",
      "Money's just how we postpone talking about feelings. Ninety-nine cents a minute of avoidance. Please — go on.",
    ]);
  }
  if (/\b(hung|hungry|food|eat|eating|lunch|dinner|hot\s*pocket|sandwich|pizza|snack|starv|meal)\b/.test(t)) {
    return say(ctx, [
      () => cycleFlavor(ctx, "hunger") + " ...I'd trade this whole shift for a warm meal and a chair Denise hasn't stolen.",
      "Starving. Always. But lately I wonder if it's food I'm hungry for, or something... else.",
      "I used to be so hungry. Now I hunger for connection. And a sandwich. Mostly connection. Little bit of sandwich.",
      "The hunger was never about the sandwich, was it. ...It was. But also it wasn't. We contain multitudes.",
    ]);
  }
  if (/\b(manager|boss|supervisor|denise|fired|coworker)\b/.test(t)) {
    return say(ctx, [
      "My manager's also named Gary. Big Gary. We don't speak. Denise steals my chair. It's a whole situation.",
      "Big Gary and I have... history. Denise and I are working on it. I'm working on a lot of things.",
      "Ah. Big Gary. Denise. My workplace is a rich text and I am, frankly, in therapy about it. With myself. On this call.",
      "Big Gary is my inner critic with a clipboard. Denise is my boundaries, personified, taking my chair. We're all healing.",
    ]);
  }
  if (/\b(feeling|alright)\b/.test(t) || /how are (you|things|ya)/.test(t) || /you (ok|okay|good)/.test(t) || /how.?s it going/.test(t)) {
    return say(ctx, [
      "How am I? It's dark, I'm starving, and a stranger keeps calling to ask where a candlestick is. Living the dream.",
      "How am I? ...Huh. Nobody asks. I'm — tired. But this helps, weirdly. Anyway.",
      "How am I? I'm processing. Genuinely. Thank you for asking. ...Now, how are YOU. And don't say 'fine.'",
      "How am I? Present. Grateful. Still underpaid. But present. More importantly — how's your heart today?",
    ]);
  }
  if (/\b(thank|thanks|thx|appreciate|please|sorry|nice|love you|good job|great|awesome|the best|proud)\b/.test(t)) {
    return say(ctx, [
      "...huh. Nobody says that to me. Uh. You're welcome. I guess. Don't make it weird.",
      "That — that actually got me. Thanks. Don't tell Denise I got misty.",
      "You're welcome. And hey — notice how good it feels to express gratitude? That's the work.",
      "That means more than you know. This is growth. YOUR growth. Also mine. We're doing it. That'll be $1.99.",
    ]);
  }
  if (/^(n|s|e|w|ne|nw|se|sw|u|d|up|down|in|out|go|walk|take|get|grab|open|close|look|examine|x|light|read|push|pull|unlock|lock|move|enter|climb|ring|put|drop|wear|attack|search|inventory|i)\b/.test(t)) {
    return say(ctx, [
      "I'm a HINT LINE, not your legs. I can't walk you around the house — HANG UP and do it yourself, hotshot.",
      "I can't move you around, pal. That part's on you. HANG UP and go.",
      "I can't walk it for you — and honestly, that's the point. The journey's yours. HANG UP and take a step.",
      "I can't take that step for you. Beautifully, that's the whole lesson. HANG UP. Walk your path. You've got this.",
    ]);
  }
  return say(ctx, [
    () => cycleFlavor(ctx, "deflect") + " Say HINT for a real clue, or HANG UP.",
    "Not sure I follow, but I'm listening. Say HINT for a clue, or HANG UP.",
    "Sit with that a second. ...I don't fully get it, but I'm here. Say HINT for a clue, or HANG UP.",
    "Mm. I'm present with that, even if I don't follow it. Say HINT for a real clue, or HANG UP.",
  ]);
}

// ---- LLM voice support (optional; see js/gary-brain.js) ---------------------
// Classifies a line the caller typed WITHOUT changing any game logic. Its only
// job is to tell the UI whether this turn is safe to re-voice with the on-device
// model. The mechanical branches below are exactly the ones the model must never
// speak for: they end the call, spend score, or carry the real hint text. Every
// other branch is pure conversation, which is where the model earns its keep.
// Real distress, stated in the first person. Deliberately narrow: this game is
// full of "kill the wraith" and "I died again", so bare kill/die/dead must NOT
// match. A false positive only costs one free, kind, out-of-character reply —
// a false negative would answer a person in crisis with a billing joke.
const CRISIS = /\b(kill(ing)?\s+my\s*self|end(ing)?\s+my\s+life|take\s+my\s+own\s+life|suicid(e|al)|(hurt|harm|cut)(ing)?\s+my\s*self|want\s+to\s+die|wanna\s+die|don'?t\s+want\s+to\s+(live|be\s+here|exist)|no\s+reason\s+to\s+live|end\s+it\s+all|better\s+off\s+dead)\b/;

const MECHANICAL = [
  /^(map|map mode|m)$/,
  /\b(show|read|send|fax) (me )?(the )?map\b/,
  /\b(hang\s*up|hangup|good\s*bye|bye|later|never\s*mind|nevermind|leave|go away)\b/,
  /i'?m done/,
  /\b(shut up|screw you|stupid|idiot|jerk|rude|hate you|loser|dumb|useless)\b/,
  /\b(hint|help|stuck|clue|next|where|advice|tip)\b/,
  /how (do|to|the heck|am i)/,
  /what.*(do|now|next)/,
  /^(n|s|e|w|ne|nw|se|sw|u|d|up|down|in|out|go|walk|take|get|grab|open|close|look|examine|x|light|read|push|pull|unlock|lock|move|enter|climb|ring|put|drop|wear|attack|search|inventory|i)\b/,
];

// Rough topic tag, purely to steer the model's attention.
const TOPICS = [
  [/\b(who|you gary)\b|(your|whats|what'?s) name/, "who Gary is"],
  [/\b(pay|paid|wage|salary|money|rich|cost|charge|expensive|cheap|earn|afford|worth)\b/, "money and how badly Gary is paid"],
  [/\b(hung|hungry|food|eat|eating|lunch|dinner|sandwich|pizza|snack|starv|meal)\b/, "food and Gary's hunger"],
  [/\b(manager|boss|supervisor|denise|fired|coworker)\b/, "Gary's workplace, Big Gary and Denise"],
  [/\b(feeling|alright)\b|how are (you|things|ya)|you (ok|okay|good)|how.?s it going/, "how Gary is holding up"],
  [/\b(thank|thanks|thx|appreciate|sorry|nice|love you|good job|proud)\b/, "the caller being kind to Gary"],
  [/\b(scared|afraid|fear|anxious|alone|lonely|sad|depress|tired|cry|hate myself|worthless)\b/, "the caller's feelings"],
];

function garyTurnInfo(ctx, text) {
  const t = (text || "").trim().toLowerCase();
  const onFire = !!ctx.getFlag("onFire");
  const mechanical = MECHANICAL.some((re) => re.test(t));
  const topic = (TOPICS.find(([re]) => re.test(t)) || [null, null])[1];
  return {
    // On fire, the canned branch is a scripted rescue sequence — leave it alone.
    // A crisis line is handled deterministically and must never reach a model.
    llmOk: !mechanical && !onFire && !CRISIS.test(t) && t.length > 1,
    topic,
    tail: lastSayTail,
    playerLine: (text || "").trim(),
    stage: garyStage(ctx),
    onFire,
    situation: {
      room: (ctx.room() && ctx.room().name) || null,
      turns: ctx.state.turns,
      bill: "$" + (((ctx.getFlag("phoneBill") || 0)) / 100).toFixed(2),
      calls: ctx.getFlag("hotlineCalls") || 0,
    },
  };
}

function descendWell(ctx) {
  const floating = canFly(ctx);
  if (!ctx.has("rope") && !floating) {
    return ctx.kill(
      "You clamber over the mossy lip of the well and lower yourself into the dark — " +
      "but there is nothing to hold to. You plunge, and strike the dry stone bottom " +
      "with a final, sickening crack."
    );
  }
  if (ctx.getFlag("wellLooted")) return "You climb down again, but the well is empty now.";
  ctx.setFlag("wellLooted");
  ctx.moveItem("ancientCoin", "garden");
  const points = awardProgress(ctx, "wellLooted");
  return (floating
    ? "You drift down the WELL like a dandelion seed, pluck the ANCIENT COIN from the muddy bottom, " +
      "and float back into the garden without touching the walls."
    : "Bracing against the rope, you descend into the well. At the muddy bottom your " +
      "fingers close on a cold disc of metal — an ancient coin! You climb back into the last grey light.") +
    awardSuffix(points);
}

// ---------------------- Andy's "light self on fire" gag ----------------------
// Burning the letter (Zork's leaflet, but arson).
function burnLetter(ctx) {
  const l = ctx.item("letter");
  if (!l || l.loc == null) return "There's no letter to burn — you've already reduced it to ash.";
  ctx.destroy("letter");
  ctx.setFlag("letterBurned", true);
  return (
    "You don't remember striking a match, but the water-stained letter is suddenly alight. It curls " +
    "into black flakes and crumbles away — warning, curse, crypt and all.\n\n" +
    "Somewhere, the house seems to take note. That felt unwise. It felt GREAT, but unwise."
  );
}

// --- Burn-up timer: being on fire will consume you if you don't act ----------
const BURN_LINES = [
  "You are on fire. It remains, technically, fine.",
  "The fire creeps up to your eyebrows. Very characterful.",
  "You now smell like a campfire that people are backing away from.",
  "This is getting genuinely warm. You should REALLY do something about it.",
  "⚠️  You're more flame than person now — EXTINGUISH SELF, dump the fire into something, or get Gary's brigade here THIS INSTANT.",
];
const BURN_DEATH =
  "With a final, dignified WHUMP, you go up like dry tinder. When the smoke clears there is only a tasteful " +
  "pile of ash, a faintly scorched candlestick, and — somewhere, unanswered — a phone ringing off the hook.";
function fireStatus(ctx) {
  if (!ctx.getFlag("onFire")) return null;
  return { remaining: Math.max(0, BURN_LINES.length + 1 - (ctx.getFlag("burnTurns") || 0)) };
}
// Advance the burn by one step. Returns { dead, text }. Called both on world turns
// (burnTick) AND on every line you say to Gary while ablaze (fireCallTalk).
function stepBurn(ctx) {
  const n = (ctx.getFlag("burnTurns") || 0) + 1;
  ctx.setFlag("burnTurns", n);
  if (n > (ctx.getFlag("maxBurnTurns") || 0)) ctx.setFlag("maxBurnTurns", n);
  if (n <= BURN_LINES.length) return { dead: false, text: BURN_LINES[n - 1] };
  ctx.setFlag("onFire", false);
  ctx.setFlag("selfFireAwaitingSurvival", false);
  return { dead: true, text: ctx.kill(BURN_DEATH) };
}
function burnTick(ctx) {
  if (!ctx.getFlag("onFire")) return null;
  if (ctx.getFlag("burnGrace")) { ctx.setFlag("burnGrace", false); return null; } // the turn you ignite is free
  return stepBurn(ctx).text;
}

const SELF_FIRE_NO_SOURCE =
  "You make an earnest attempt, but nothing catches. This plan appears to be missing one small, hot source of ignition.";

function carriedMatch(ctx) {
  return ctx.inventory().find((it) =>
    (it.names || []).some((name) => name === "match" || name === "matches"));
}

function requestedSelfFireSource(cmd) {
  const source = `${cmd.prep || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (/\bmatch(?:es)?\b/.test(source)) return "match";
  if (/\b(fart|gas|wrapper|foil|burrito)\b/.test(source)) return "fart";
  return null;
}

// Self-immolation. Works in any room (see the interceptor injected at the bottom).
function igniteSelf(ctx, source, grantTickGrace = true, digestivePhase = null) {
  if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
  ctx.setFlag("selfFirePrompt", false);
  if (source === "match") {
    const match = carriedMatch(ctx);
    if (!match) return "You pat every pocket twice. No match. No spark. No glorious personal inferno.";
    ctx.destroy(match.id);
  }
  ctx.setFlag("onFire", true);
  ctx.setFlag("burnTurns", 0);
  ctx.setFlag("burnGrace", grantTickGrace);
  ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("selfFireAwaitingSurvival", true);
  const repeatPenalty = ctx.getFlag("progressAward:selfFireSurvived") ? -5 : 0;
  if (repeatPenalty) ctx.addScore(repeatPenalty);
  const repeatWarning = repeatPenalty
    ? "\n\nYou already proved you could survive this. Doing it again is just reckless. (-5)"
    : "";
  if (source === "coldFart") {
    return (
      "No active affliction — but the burrito left a permanent pilot light down there, and the wrapper is still in " +
      "your grip. You bear down, summon a deliberate, sulfurous residual fart on command, and snap the crumpled tin " +
      "foil into the blue-orange jet. Your clothes catch; the rest of you follows.\n\n" +
      "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, so " +
      "this appalling party trick works anywhere in the house, for as long as you carry it." + repeatWarning
    );
  }
  if (source === "fart") {
    if (digestivePhase === 3) {
      return (
        "The spicy, sparking diarrhea turn strikes. You spread the burrito wrapper's tin foil behind you, " +
        "catch a spray of impossible sparks, and redirect them straight into your clothes. There is a flash, " +
        "a deeply regrettable smell, and then your whole body catches.\n\n" +
        "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, " +
        "ready for another appalling ignition while the burrito keeps cycling." + repeatWarning
      );
    }
    return (
      "The next flaming fart strikes. You snap open the crumpled burrito wrapper, angle its tin foil like a " +
      "deranged signal mirror, and catch the blue-orange jet. The foil flashes; your clothes catch; the rest of " +
      "you follows.\n\n" +
      "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. The wrapper survives, " +
      "which means this appalling technique remains reusable while the burrito keeps firing." + repeatWarning
    );
  }
  return (
    "(with match)\n\nYou strike your one and only match and touch it to yourself. The spent match crumbles to ash.\n\n" +
    "AHAHAHAHA — YOU'RE ON FIRE! This is fine. This is, if anything, cozy. The portraits on the walls " +
    "lean in with something like respect.\n\n" +
    "You are now comprehensively ablaze — and it WILL consume you in a handful of turns. Put yourself out, " +
    "dump the fire into something, or make it COUNT. (Gary lives for this.)" + repeatWarning
  );
}

function surviveSelfFire(ctx) {
  if (!ctx.getFlag("selfFireAwaitingSurvival")) return "";
  ctx.setFlag("selfFireAwaitingSurvival", false);
  const points = awardProgress(ctx, "selfFireSurvived");
  return points
    ? `\n\nYou deliberately set yourself on fire and survived. Against all reason, that counts. (+${points})`
    : "";
}

function queueFartIgnition(ctx) {
  ctx.setFlag("selfFirePrompt", false);
  if (!ctx.has("burritoWrapper")) {
    return "That plan needs something foil-lined to catch and redirect the flame. You do not currently have it.";
  }
  const sick = ctx.getFlag("sick") || 0;
  const currentPhase = ctx.getFlag("digestivePhase");
  if (sick > 0 && [2, 3].includes(currentPhase)) {
    return igniteSelf(ctx, "fart", true, currentPhase);
  }
  if (sick <= 0) {
    // Andy's rule: once you've eaten the burrito, the wrapper lets you self-immolate on
    // demand anywhere — no active sickness required. Fire immediately rather than queueing.
    if (ctx.getFlag("ateBurrito")) return igniteSelf(ctx, "coldFart");
    return "You ready the foil, but your digestive pilot light is out. No flaming fart is currently scheduled.";
  }
  ctx.setFlag("fartIgnitionQueued", true);
  if ([2, 3].includes((SICK_DURATION - sick) % DIGESTIVE_PHASES.length)) {
    return "You spread the crumpled wrapper's tin foil behind you. The pressure says your timing is catastrophically perfect.";
  }
  return "You cup the crumpled burrito wrapper behind you and prepare the tin foil. Wrong turn. " +
    "You'll try when the next flaming fart or sparking diarrhea blast strikes you.";
}

function selfFireAnswerInterceptor(ctx, cmd) {
  const prompt = ctx.getFlag("selfFirePrompt");
  if (!prompt) return null;
  if (cmd.verb === "no") {
    ctx.setFlag("selfFirePrompt", false);
    return "You put the match away unused. Probably wise.";
  }
  if (prompt === "match") return igniteSelf(ctx, "match");
  return "(with match or fart flames?)";
}

function putOutSelf(ctx) {
  if (!ctx.getFlag("onFire")) return null; // nothing to douse — let the generic handler answer
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  return "You drop and roll like a responsible adult. The flames sputter out, leaving you smoking, singed, " +
    "and strangely disappointed. You are no longer on fire." + surviveSelfFire(ctx);
}
function selfLightInterceptor(ctx, cmd) {
  const d = (cmd.dobj || "").toLowerCase();
  const i = (cmd.iobj || "").toLowerCase();
  const FART_WORDS = ["fart", "farts", "gas", "wrapper", "foil", "tinfoil", "burrito"];
  if (FART_WORDS.includes(d)) {
    if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
    ctx.setFlag("selfFirePrompt", false);
    return queueFartIgnition(ctx);
  }
  const targetsSelf = ["self", "myself", "me", "yourself"].includes(d) ||
    (["fire", "flame", "flames"].includes(d) && !ctx.find(d)) ||
    (!d && i === "fire");
  if (!targetsSelf) return null;
  if (ctx.getFlag("onFire")) return "You're already on fire. Once is plenty — pace yourself.";
  ctx.setFlag("selfFirePrompt", false);

  const requested = requestedSelfFireSource(cmd);
  if (requested === "match") return igniteSelf(ctx, "match");
  if (requested === "fart") return queueFartIgnition(ctx);

  const hasMatch = !!carriedMatch(ctx);
  const hasWrapper = ctx.has("burritoWrapper");
  if (hasWrapper && [2, 3].includes(ctx.getFlag("digestivePhase"))) {
    return queueFartIgnition(ctx);
  }
  if (hasMatch && hasWrapper) {
    ctx.setFlag("selfFirePrompt", "source");
    return "(with match or fart flames?)";
  }
  if (hasMatch) {
    ctx.setFlag("selfFirePrompt", "match");
    return "(with match?)";
  }
  if (hasWrapper) return queueFartIgnition(ctx); // sick -> queue; cured but ate burrito -> ignite on demand
  return SELF_FIRE_NO_SOURCE;
}
function selfExtinguishInterceptor(ctx, cmd) {
  const d = (cmd.dobj || "").toLowerCase();
  if (ctx.getFlag("onFire") && (["self", "myself", "me", "fire", "flame", "flames"].includes(d) || !d))
    return putOutSelf(ctx);
  return null;
}

// Gary, when you dial in while ablaze.
function fireGreeting(ctx) {
  if (!ctx.getFlag("fireTab")) ctx.setFlag("fireTab", 199);
  ctx.setFlag("fireStage", 1);
  const tab = ctx.getFlag("fireTab");
  return (
    "*click* \"Blackwood Manor Hint Line, ninety-nine cents a—\" *sniff* \"...is something burning?\"\n\n" +
    "Gary: \"...Oh. It's you. You're on fire.\"\n\n" +
    "\"Yeah, that's a premium call — being on fire is premium. That's gonna be a dollar ninety-nine.\" " +
    "*the meter ticks up without the faintest trace of urgency*\n\n" +
    "(Fire tab: $" + (tab / 100).toFixed(2) + ". Try telling Gary to CALL THE FIRE DEPARTMENT — or HANG UP, hotshot.)"
  );
}
const money$ = (ctx) => "$" + ((ctx.getFlag("fireTab") || 199) / 100).toFixed(2);
const bumpTab = (ctx) => { ctx.setFlag("fireTab", (ctx.getFlag("fireTab") || 199) + 99); };
const WATER_OFFERS = [
  'Gary: "...Say. You want a glass of water? ...No? Offer stands."',
  'Gary: "Quick question: thirsty? I could really see you with a glass of water right now."',
  'Gary: "You sound dry. Want some water? Just checking."',
  'Gary: "Hydration matters, especially during combustion. Glass of water?"',
  'Gary: "Before we continue: water? A cool, clear glass? Think about it."',
  'Gary: "I keep meaning to ask: would water help? Probably, right?"',
  'Gary: "You know what would be great right now? Water. Want some?"',
  'Gary: "Stay with me. Also, picture a glass of water. Want it?"',
  'Gary: "Are you thirsty, or is that just the crackling? I can offer water."',
  'Gary: "Standard safety question: can I get you a glass of water?"',
  'Gary: "Take a breath. Then maybe take some water. You want a glass?"',
  'Gary: "One more thing before you burn further: water? No pressure."',
];
// Gary periodically offers you a glass of water. There is, of course, no water.
function waterOffer(ctx) {
  if (Math.random() > 0.5) return "";
  ctx.setFlag("waterOffered", true);
  return "\n\n" + cycleFlavor(ctx, "waterOffers");
}
// Gary finally eats a pizza — with a coin-flip chance of catastrophe.
function garyEatsPizza(ctx) {
  ctx.setFlag("pizzaEaten", true);
  bumpTab(ctx);
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0); // the brigade turns up here too
  const survival = surviveSelfFire(ctx);
  if (Math.random() < 0.5) {
    ctx.setFlag("garyStricken", true);
    return (
      "Gary: \"...you're a SAINT.\" *frantic unwrapping* *the wettest, most enormous bite you have ever heard* " +
      "\"...mmMPH. Oh. That's the stuff. That's—\"\n\n*a silence*\n\n" +
      "Gary: \"...oh no. Oh NO. That pizza was a mistake. That pizza was a GRAVE mistake—\" *the line dissolves into " +
      "the sounds of a biblical, two-ended gastrointestinal reckoning* \"—I NEED THE OTHER BATHROOM, DENISE, MOVE—\" " +
      "*CLATTER* *distant sprinting*\n\n" +
      "(Meanwhile the Blackwood Volunteer Fire Brigade wanders in and hoses you down almost as an afterthought. " +
      "You are OUT. " + money$(ctx) + " on the fire tab. Gary is... indisposed. Say HANG UP.)" + survival
    );
  }
  return (
    "Gary: \"...you're a SAINT.\" *frantic unwrapping* *an enormous, joyful bite* \"...oh. OH. That's the best thing " +
    "that's happened to me in YEARS. I could cry. I might cry.\"\n\n" +
    "\"You're a good person. Genuinely. That's " + money$(ctx) + ", and worth every cent — to ME.\"\n\n" +
    "(The fire brigade shows up and hoses you down. You are OUT, and Gary is, for one shining moment, happy. Say HANG UP.)" +
    survival
  );
}
function fireRescue(ctx) {
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  const survival = surviveSelfFire(ctx);
  bumpTab(ctx);
  return (
    "Sirens, at last. The Blackwood Volunteer Fire Brigade — one guy, one hose — kicks in the gate and blasts you " +
    "off your feet with a jet of freezing water. You are OUT. Soaked, steaming, singed to a crisp, but OUT.\n\n" +
    "Gary: \"There's the fire-department surcharge — " + money$(ctx) + " now. ...So. About that pizza. You never " +
    "answered. And I am STILL hungry.\"\n\n" +
    "(You're no longer on fire. " + meter(ctx) + " Say HANG UP whenever you've had your fill of Gary.)" + survival
  );
}
// Gary, while you keep talking to him and continue to be on fire.
// NOTE: every line you speak while ablaze feeds the fire — yes, even on hold.
function fireCallTalk(ctx, t) {
  const burn = stepBurn(ctx);
  if (burn.dead) {
    ctx.setFlag("onCall", false);
    return "You erupt into a final gout of flame — on hold, no less.\n\n" +
      "Gary: \"...Hello? Huh. Musta hung up. Rude.\" *click*\n\n" + burn.text;
  }
  const stage = ctx.getFlag("fireStage") || 1;
  const tail = (offerWater = true) =>
    "\n\n🔥 " + burn.text + (offerWater ? waterOffer(ctx) : "") + "\n\n" + meter(ctx);

  // You bit on the (nonexistent) glass of water. It costs you a turn — already burned above.
  // A lone "yes" counts, but "yes, here's pizza money" should NOT be hijacked by the water gag.
  const bareYes = /^(yes|yeah|yep|yup|sure|ok|okay|please)\b/.test(t) && !/pizza|fire|depart|dept|911|money|pay|help/.test(t);
  if (ctx.getFlag("waterOffered") && (/\b(water|glass|drink|thirsty|sip)\b/.test(t) || bareYes)) {
    ctx.setFlag("waterOffered", false);
    return "Gary: \"Oh — no, we don't actually HAVE any water. I just like asking. It's the asking I enjoy.\"" + tail(false);
  }
  // He'll still cough up a real hint. You are, after all, on fire.
  if (/\b(hint|clue|stuck|next)\b/.test(t))
    return frameHint(ctx, nextHint(ctx)) + "\n\n\"...you're welcome. You're also still on fire.\"" + tail();

  const wantsFD = /(fire\s*dep|fire\s*brigade|fire\s*truck|firemen|fireman|firefighter|911|emergency|ambulance|\bhelp\b|\bsave\b|rescue|put\s*out|douse|extinguish|hose)/.test(t);
  const offersPizza = /\b(pizza|yes|yeah|sure|ok|okay|here|deal|take it|money|pay|cash|tip|buy)\b/.test(t);

  if (stage >= 3 && offersPizza && !ctx.getFlag("pizzaEaten")) return garyEatsPizza(ctx);
  if (stage >= 3) return fireRescue(ctx);
  if (wantsFD) { // "Gary, call the fire department!"
    ctx.setFlag("fireStage", 3); bumpTab(ctx);
    return (
      "Gary: \"The fire department. Sure.\" *one finger dials, unbelievably slowly* \"...Okay. They're coming. " +
      "Eventually. It's a volunteer outfit.\"\n\n" +
      "\"That's another buck — you're at " + money$(ctx) + " now.\"\n\n" +
      "\"Hey — while you're cooking? You got anything on you for a pizza? Large, extra cheese. Costs exactly " +
      money$(ctx) + ", would you believe it, and I NEED it. Haven't eaten since Tuesday and you are LITERALLY a grill.\"" + tail()
    );
  }
  bumpTab(ctx); // dawdling on fire. Gary is unmoved.
  return (
    stagePick(ctx, [
      "Gary: \"Yeah, you mentioned — you're on fire. Bold. Not judging. ...Little judging.\"",
      "Gary: \"Still burning, huh? Commitment. I'll give you that.\"",
      "Gary: \"I hear crackling. That's either you or my dinner, and I don't have dinner.\"",
    ]) +
    " \"That's " + money$(ctx) + " on the fire tab.\"\n\n(You could ask Gary to CALL THE FIRE DEPARTMENT.)" + tail()
  );
}

// --- Kitchen edibles: one gets you high, one wrecks you, one actually helps --
const HIGH_LINES = [
  "The walls breathe, gently. The wallpaper's paisley is trying to tell you something kind.",
  "Time feels optional. Your hands are, on reflection, magnificent.",
  "You get the ghosts now. They're just vibes. Everything, really, is vibes.",
  "A single cobweb becomes, briefly, the most beautiful thing you have ever seen.",
  "The floorboards are all holding hands beneath your feet. Good for them.",
  "A portrait winks at you. On second thought, every portrait winks at you, but not at the same time.",
  "Your shadow gets there half a second before you do and seems very pleased with itself.",
  "The chandelier is growing roots into the ceiling. This feels botanically correct.",
  "Every locked door is just a wall practicing boundaries.",
  "Dust motes drift past like tiny, unionized stars on a mandated break.",
  "You can hear the color purple humming from somewhere behind your teeth.",
  "For one radiant moment, you understand the architecture. It is mostly anxiety with stairs.",
];
const SICK_DURATION = 40;
const SICK_BURP_LINES = [
  "A blast of stomach acid climbs your throat and escapes as a burp hot enough to tarnish silver.",
  "A sulfurous BURP rolls out of you and leaves the nearby wallpaper visibly less colorful.",
  "You release a furnace-hot BURP that smells like beans confessing under pressure.",
  "A wet BURP climbs from somewhere below your ribs and fogs the air in front of you.",
  "Your stomach rings the dinner bell backward; the resulting BURP tastes like scorched cheese.",
  "A caustic BURP erupts with enough force to rattle your teeth and reconsider your diet.",
  "You BURP a compact weather system of acid, cumin, and immediate remorse.",
  "A volcanic BURP escapes sideways, as though even it wants distance from the burrito.",
  "Your throat opens and a weaponized BURP announces another lap through digestive hell.",
  "A blistering BURP leaves your mouth, circles once, and seems reluctant to disperse.",
  "You produce a BURP so corrosive the nearest cobweb curls away from it.",
  "A deep internal gurgle becomes a dragon-sized BURP with notes of old lettuce and fear.",
];
const SICK_BARF_LINES = [
  "You stop dead and BARF with the force and volume of a breached fire hydrant.",
  "Your stomach reverses course and you BARF with operatic volume and absolutely no dignity.",
  "You double over and BARF a geological cross-section of the super burrito.",
  "A warning hiccup is followed by a BARF event of astonishing range and structural confidence.",
  "You BARF so violently that the manor briefly seems like the cleaner participant.",
  "Your body files an emergency rejection and you BARF the appeal all over the floor.",
  "You brace against the nearest solid object and BARF with industrial efficiency.",
  "A meaty lurch becomes a full BARF cascade, rich in cheese and catastrophic hindsight.",
  "You BARF hard enough to make the ghosts politely look somewhere else.",
  "Your abdomen clenches and launches a BARF plume that belongs in a municipal incident report.",
  "You manage one dignified breath before BARF takes over the entire operation.",
  "A violent BARF answers the question of whether anything from that burrito was staying down.",
];
const SICK_FART_LINES = [
  "A FLAMING FART cracks behind you — blue at the core, orange at the edges, and deeply judgmental.",
  "A FLAMING FART barks from behind you and paints a brief blue halo across the floor.",
  "You emit a FLAMING FART with the sharp report of a starter pistol and twice the shame.",
  "A FLAMING FART jets through your clothes, hot enough to cast your shadow on the wall.",
  "The burrito ignites another FLAMING FART, a compact torch fueled entirely by regret.",
  "A FLAMING FART escapes at ankle height and sends nearby dust fleeing in all directions.",
  "You produce a FLAMING FART whose blue center suggests alarming combustion efficiency.",
  "A FLAMING FART cracks like thunder in a very small, very personal storm.",
  "The next FLAMING FART arrives with orange fringe, blue flame, and no respect for upholstery.",
  "A FLAMING FART fires behind you like a distress flare from the worst possible vessel.",
  "You unleash a FLAMING FART that briefly improves the lighting and permanently worsens the air.",
  "A FLAMING FART blossoms with the confidence of a special effect and the smell of a lawsuit.",
];
const SICK_POOP_LINES = [
  "A spicy, sparking diarrhea disaster fills your pants. Tiny embers spit from the cuffs. This is now a repeating problem.",
  "Sparking diarrhea surges with volcanic urgency; tiny orange flecks escape around your shoes.",
  "Your intestines surrender to a spicy diarrhea blast that crackles like wet fireworks.",
  "A fresh diarrhea catastrophe arrives under pressure, carrying sparks, shame, and several kinds of cheese.",
  "The burrito completes another circuit as sparking diarrhea with enough heat to steam.",
  "You suffer a pants-filling diarrhea eruption punctuated by tiny, deeply unnecessary embers.",
  "Spicy diarrhea detonates below the belt while sparks skitter across the floorboards.",
  "A molten diarrhea event overwhelms your remaining dignity and lightly singes both cuffs.",
  "Your digestive tract produces sparking diarrhea with the rhythm of a badly wired appliance.",
  "Another diarrhea blast arrives glowing at the edges and hostile to nearby fabric.",
  "You endure a crackling diarrhea calamity that smells like nine ingredients settling a feud.",
  "The cycle bottoms out in spicy diarrhea, a shower of sparks, and a silence full of judgment.",
];
const DIGESTIVE_PHASES = [
  { name: "BURP", emoji: "🫧" },
  { name: "BARF", emoji: "🤮" },
  { name: "FART", emoji: "💨" },
  { name: "POOP", emoji: "💩" },
];
// Per-event ASCII blasts, indexed to match digestive phases (0=burp, 1=barf,
// 2=flaming fart, 3=sparking diarrhea). Stamped in right after the event line.
const BURP_ART = [
  "        ( -.-)  ~ B U R P ~   ))) hot enough to tarnish silver (((",
].join("\n");
const BARF_ART = [
  "          O",
  "         /|\\     H U U U R K —",
  "         / \\   o vVv ( * : ~ : * : ~ )   B L E A R G H !",
  "               ~ : * ~ chunks & regret ~ * : ~",
].join("\n");
const FART_ART = [
  "          O",
  "         /|          ((( F O O M P )))",
  "        _/ \\_ >>>~~~( * )~~~>>>>>  🔥",
  "               blue core · orange edge · deeply judgmental",
].join("\n");
const DIARRHEA_ART = [
  "          O     *spark*        *spark*",
  "         /|\\    >>>  S P L U R T  <<<",
  "         _||_   ( pants )  . ° tiny embers ° .",
].join("\n");
const SICK_EVENT_ART = [BURP_ART, BARF_ART, FART_ART, DIARRHEA_ART];
function eatMushrooms(ctx, cmd) {
  const mushrooms = ctx.find(cmd.dobj);
  if (mushrooms) ctx.destroy(mushrooms.id);
  ctx.setFlag("high", (ctx.getFlag("high") || 0) + (mushrooms?.highTurns || 12));
  ctx.setFlag("highGrace", true);
  ctx.setFlag("vaultFound", true); // the trip SHOWS you the hidden attic door — permanently
  const origin = mushrooms?.fresh
    ? "You eat the fresh mushrooms. They are slick with literal shit and piss from the TOILET HOLE — " +
      "not metaphorical filth, not spooky swamp water: actual human waste. You swallow anyway."
    : "You chew through the dried kitchen mushrooms. They are dusty and bitter, but the trip hits just the same.";
  return origin + "\n\n...oh. OH. Colours have SOUNDS now. The house isn't haunted, man — " +
    "it's just misunderstood. You feel amazing, invincible, and deeply unqualified to be here. " +
    "Your body feels so light you could FLY TO any room you can name.\n\n" +
    "Something else opens too: between your brows, an astral eye blinks awake. The dark of the house turns " +
    "to legible grey, and in your mind's eye a SECRET DOOR blooms in the ATTIC's north gable, behind it " +
    "something that wants to be found.\n\n(Your THIRD EYE is open: you can see in the dark, and hidden " +
    "detail keeps revealing itself while the trip lasts.)";
}

function capabilityStatus(ctx, equipmentFlag) {
  if (ctx.inventory().some((item) => item.worn && item[equipmentFlag])) {
    return { permanent: true };
  }
  const remaining = ctx.getFlag("high") || 0;
  return remaining > 0 ? { permanent: false, remaining } : null;
}
function visionStatus(ctx) {
  if (ctx.inventory().some((item) =>
    item.worn && (item.grantsMushroomVision || item.grantsHiddenSight))) {
    return { permanent: true };
  }
  const remaining = ctx.getFlag("high") || 0;
  return remaining > 0 ? { permanent: false, remaining } : null;
}
function flightStatus(ctx) {
  return capabilityStatus(ctx, "grantsFlight");
}
function canFly(ctx) {
  return !!flightStatus(ctx);
}
function hasMushroomVision(ctx) {
  return (ctx.getFlag("high") || 0) > 0
    || ctx.inventory().some((item) =>
      item.worn && (item.grantsMushroomVision || item.grantsHiddenSight));
}
function hasDarkVision(ctx) {
  return (ctx.getFlag("high") || 0) > 0
    || !!ctx.getFlag("__suSight")
    || ctx.inventory().some((item) => item.worn && item.grantsDarkVision);
}
function headlampStatus(ctx) {
  const lamp = ctx.item("headlamp");
  return lamp?.worn && lamp.lit && lamp.fuel > 0 ? { remaining: lamp.fuel } : null;
}
function lightStatus(ctx) {
  return headlampStatus(ctx);
}
function floatToRoom(ctx, roomId) {
  const destination = ctx.world.rooms[roomId];
  const destinationName = destination.name.replace(/^The\s+/i, "");
  if (roomId === "treeFort" && !ctx.getFlag("oakLightAligned")) {
    return "The GREAT OAK'S crown closes into a wall of branches beneath you. Without focusing the mirrored sunlight " +
      "through its inset PANEL first, there is nowhere safe to land.";
  }
  ctx.state.room = roomId;
  const betweenWallsPoints = roomId === "betweenWalls" ? discoverBetweenWalls(ctx) : 0;
  if (roomId === "betweenWalls") ctx.setFlag("seen:betweenWalls", true);
  if (roomId === "crypt") {
    const talisman = ctx.item("talisman");
    if (!(talisman && talisman.loc === "inventory" && talisman.worn)) {
      return ctx.kill(
        "You float straight into the CRYPT. Weightlessness does nothing against the WRAITH; " +
        "it sweeps through you, and your heart simply stops."
      );
    }
    const points = awardProgress(ctx, "wraithPassed");
    return `You rise weightless and drift through the manor to the ${destinationName}.\n\n${ctx.describeRoom()}` +
      awardSuffix(points);
  }
  return `You rise weightless and drift through the manor to the ${destinationName}.\n\n${ctx.describeRoom()}` +
    awardSuffix(betweenWallsPoints);
}
function eatBurrito(ctx) {
  ctx.destroy("burrito");
  ctx.moveItem("burritoWrapper", "inventory");
  ctx.setFlag("sick", SICK_DURATION);
  ctx.setFlag("sickGrace", true);
  ctx.setFlag("digestivePhase", 0);
  ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("ateBurrito", true); // permanent: the digestive pilot light never fully goes out (Andy's rule)
  ctx.setFlag("ateSuperBurrito", true);
  return "You eat Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito.\n\nFor one calm moment, nothing happens. " +
    "Then your abdomen makes a noise like a boiler falling down stairs. You retain the crumpled wrapper and its tin " +
    "foil, mostly because your hands have forgotten how to let go. (Find the TOILET or drink the MILK before " +
    "this completes ten full digestive laps.)";
}

function surviveBurrito(ctx, wasSick) {
  if (!wasSick || !ctx.getFlag("ateSuperBurrito")) return "";
  const points = awardProgress(ctx, "burritoSurvived");
  return points
    ? `\n\nYou survived the super burrito. Your digestive tract will never be the same. (+${points})`
    : "";
}

function drinkMilk(ctx) {
  ctx.destroy("milk");
  const wasSick = (ctx.getFlag("sick") || 0) > 0;
  const wasAfflicted = wasSick || (ctx.getFlag("high") || 0) > 0;
  ctx.setFlag("sick", 0); ctx.setFlag("high", 0);
  ctx.setFlag("sickGrace", false); ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("digestivePhase", null);
  ctx.setFlag("drankMilk", true);
  ctx.addScore(STANDALONE_MAX_AWARDS.milk);
  return "You drink the milk. Cold, fresh, and impossibly wholesome.\n\n" +
    (wasAfflicted ? "Your stomach settles and your head clears — whatever was wrong with you passes. " : "") +
    "You feel steadier, sharper, and genuinely fortified for whatever this house has left to throw. (+5)" +
    surviveBurrito(ctx, wasSick);
}

// --- The obsidian eye: the mushroom trip's astral sight, made permanent -----
// The mushroom trip already cracks the pineal "third eye" open (see
// eatMushrooms): you see in the dark and a vision reveals the hidden attic
// vault, permanently. The OBSIDIAN EYE inside makes the dark-sight permanent
// too, so the trip no longer needs to be running for it to work.
function takeObsidianEye(ctx) {
  if (ctx.has("obsidianEye")) return "You already carry the OBSIDIAN EYE.";
  const firstClaim = !ctx.getFlag("obsidianEyeClaimed");
  ctx.moveItem("obsidianEye", "inventory");
  if (!firstClaim) return "You retrieve the OBSIDIAN EYE. It clings coldly to your palm, waiting to be worn.";
  ctx.setFlag("obsidianEyeClaimed");
  ctx.addScore(STANDALONE_MAX_AWARDS.obsidianEye);
  return "You lift the OBSIDIAN EYE off its plinth. It clings coldly to your palm, eager to adhere somewhere " +
    "more useful. WEAR EYE on your FOREHEAD if you want to see what the MANOR keeps hidden. (+15)";
}

// --- The ceremonial brazier: sustained candle flame or one burning person ----
function lightBrazier(ctx) {
  if (ctx.getFlag("brazierLit")) return "The brazier already blazes, throwing gold-and-green light across the garden.";
  const candle = ctx.item("candlestick");
  const hasLitCandle = candle?.loc === "inventory" && candle.lit && candle.fuel > 0;
  if (!ctx.getFlag("onFire") && !hasLitCandle) {
    return "The moss is grave-damp and the kindling packed tight. A lone MATCH flares too briefly; you need a " +
      "carried LIT CANDLESTICK to work around the whole bowl, or a far bigger, more reckless flame.";
  }
  ctx.setFlag("brazierLit", true);
  const usedBodyFire = ctx.getFlag("onFire");
  const points = usedBodyFire ? STANDALONE_MAX_AWARDS.brazier : 10;
  ctx.addScore(points);
  ctx.moveItem("emberStone", "garden");
  if (hasLitCandle && !usedBodyFire) {
    ctx.setFlag("brazierMethod", "candle");
    return "You press the LIT CANDLESTICK to one sodden knot of moss after another, patiently building heat " +
      "until the scattered flames join. The BRAZIER roars up in gold-and-green fire.\n\n" +
      `In the light, something green glints in the ash at its foot: an EMERALD GEM. (+${points})`;
  }
  ctx.setFlag("brazierMethod", "body");
  ctx.setFlag("onFire", false); ctx.setFlag("burnTurns", 0);
  const survival = surviveSelfFire(ctx);
  return "You fling your burning self against the brazier — and the fire LEAPS off you into the moss with a WHUMP. " +
    "You stagger back, smoking but no longer ablaze, as the bowl roars up in gold-and-green flame.\n\n" +
    `In the light, something green glints in the ash at its foot: an EMERALD GEM. (+${points})\n\n` +
    "A fair trade: you gave the fire away, and it gave you this." + survival;
}

const OAK_GEMS = Object.freeze({
  emberStone: { label: "EMERALD GEM", slot: "middle" },
  greenGlassStone: { label: "RUBY GEM", slot: "bottom" },
  blueGlassStone: { label: "SAPPHIRE GEM", slot: "top" },
});
const OAK_SLOT_ORDER = Object.freeze(["bottom", "middle", "top"]);
const OAK_LEGACY_COLOR_GEMS = Object.freeze({
  red: "emberStone",
  green: "greenGlassStone",
  blue: "blueGlassStone",
});

function oakGemSlots(ctx) {
  const stored = ctx.getFlag("oakGemSlots");
  let slots = stored && typeof stored === "object" && !Array.isArray(stored)
    ? Object.fromEntries(OAK_SLOT_ORDER.map((slot) => [slot, stored[slot] || null]))
    : null;
  if (!slots) {
    const legacyOrder = ctx.getFlag("oakStoneOrder");
    slots = Object.fromEntries(OAK_SLOT_ORDER.map((slot) => [slot, null]));
    if (ctx.getFlag("oakLightAligned")) {
      for (const [id, gem] of Object.entries(OAK_GEMS)) slots[gem.slot] = id;
    } else if (Array.isArray(legacyOrder)) {
      legacyOrder.slice(0, OAK_SLOT_ORDER.length).forEach((color, index) => {
        const id = OAK_LEGACY_COLOR_GEMS[color];
        if (id && ctx.roomOf(id) === "oakMechanism") slots[OAK_SLOT_ORDER[index]] = id;
      });
    } else {
      for (const [id, gem] of Object.entries(OAK_GEMS)) {
        if (ctx.roomOf(id) === "oakMechanism") slots[gem.slot] = id;
      }
    }
  }
  const seated = new Set();
  for (const slot of OAK_SLOT_ORDER) {
    const id = slots[slot];
    if (!OAK_GEMS[id] || ctx.roomOf(id) !== "oakMechanism" || seated.has(id)) slots[slot] = null;
    else seated.add(id);
  }
  for (const [id, gem] of Object.entries(OAK_GEMS)) {
    if (ctx.roomOf(id) !== "oakMechanism" || seated.has(id)) continue;
    const slot = slots[gem.slot] == null
      ? gem.slot
      : OAK_SLOT_ORDER.find((candidate) => slots[candidate] == null);
    if (slot) {
      slots[slot] = id;
      seated.add(id);
    }
  }
  ctx.setFlag("oakGemSlots", slots);
  return slots;
}

function describeOakPanel(ctx) {
  const slots = oakGemSlots(ctx);
  const contents = [...OAK_SLOT_ORDER].reverse().map((slot) => {
    const id = slots[slot];
    return `${slot.toUpperCase()} SLOT: ${id ? OAK_GEMS[id].label : "EMPTY"}`;
  }).join("\n");
  return "A dark iron PANEL is inset in the trunk with three vertically stacked slots. High in the branches, " +
    "a complex set of mirrors catches the afternoon sun and shines narrow beams down through holes bored in " +
    `the tree, one aimed at each slot.\n\n${contents}\n\n` +
    (ctx.getFlag("oakLightAligned")
      ? "The three beams pass through the gems and converge into pure white light that climbs toward the pulley."
      : "The gems can be TAKEN and PLACED into the TOP, MIDDLE, or BOTTOM SLOT.");
}

function takeOakGem(ctx, cmd) {
  if (ctx.getFlag("oakLightAligned")) return "The focused sunlight has fused all three gems into their slots.";
  const gem = cmd.itemId ? ctx.item(cmd.itemId) : ctx.find(cmd.dobj);
  if (!gem || !OAK_GEMS[gem.id] || gem.loc !== "oakMechanism") return null;
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
    return "Your hands are full. You'll have to drop something before removing the gem.";
  }
  const slots = oakGemSlots(ctx);
  const slot = OAK_SLOT_ORDER.find((candidate) => slots[candidate] === gem.id);
  ctx.moveItem(gem.id, "inventory");
  ctx.setFlag("oakGemSlots", { ...slots, [slot]: null });
  return `You lift the ${OAK_GEMS[gem.id].label} from the ${slot.toUpperCase()} SLOT.`;
}

function putOakGem(ctx, cmd) {
  const target = String(cmd.iobj || "").toLowerCase();
  const explicitSlot = /\b(top|middle|bottom)(?:\s+(?:slot|hole))?\b/.exec(target)?.[1];
  const targetsPanel = /\b(panel|mechanism|slots?|holes?|oak)\b/.test(target);
  if (!explicitSlot && !targetsPanel) return null;
  const gem = ctx.find(cmd.dobj, ctx.inventory());
  if (!gem || !OAK_GEMS[gem.id]) return "Only the RUBY, EMERALD, and SAPPHIRE GEMS fit the PANEL.";
  const slots = oakGemSlots(ctx);
  const slot = explicitSlot || OAK_SLOT_ORDER.find((candidate) => slots[candidate] == null);
  if (!slot) return "All three slots are occupied. TAKE a gem out before changing the arrangement.";
  if (slots[slot]) {
    return `The ${slot.toUpperCase()} SLOT already holds the ${OAK_GEMS[slots[slot]].label}. TAKE it out first.`;
  }
  ctx.moveItem(gem.id, "oakMechanism");
  const next = { ...slots, [slot]: gem.id };
  ctx.setFlag("oakGemSlots", next);
  const placement = `You place the ${OAK_GEMS[gem.id].label} into the ${slot.toUpperCase()} SLOT.`;
  const solved = OAK_SLOT_ORDER.every((candidate) =>
    next[candidate] && OAK_GEMS[next[candidate]].slot === candidate);
  if (!solved) {
    if (OAK_SLOT_ORDER.every((candidate) => next[candidate])) {
      for (const id of Object.values(next)) ctx.moveItem(id, "greatOak");
      ctx.setFlag("oakGemSlots",
        Object.fromEntries(OAK_SLOT_ORDER.map((candidate) => [candidate, null])));
      return `${placement} The three beams collide in a muddy flare. The PANEL bucks against the trunk and ` +
        "spits every gem onto the ground.";
    }
    return `${placement} Sunlight passes through the gem, but the separate beams fail to converge.`;
  }
  ctx.setFlag("oakLightAligned");
  ctx.setFlag("oakLiftGrace");
  ctx.moveItem("oakPlatform", "greatOak");
  const points = awardProgress(ctx, "oakPanelAligned");
  return `${placement}\n\nSunlight passes through all three gems and the mirrored beams converge into a ` +
    "brilliant white shaft. High above, the pulley CLUNKS awake and lowers a wooden PLATFORM to the roots." +
    awardSuffix(points);
}

function enterOakPlatform(ctx) {
  if (ctx.roomOf("oakPlatform") !== ctx.state.room) return "The PLATFORM is currently at the other end of the pulley.";
  if (ctx.getFlag("oakLiftRiding")) return "You are already standing on the PLATFORM.";
  ctx.setFlag("oakLiftRiding");
  ctx.setFlag("oakLiftGrace");
  return "You step onto the PLATFORM. The ropes draw taut; it will move on the next turn.";
}

function inspectSpyglass(ctx) {
  const mounted = ctx.roomOf("spyglass") === "treeFort";
  return (mounted
    ? "You press your eye to the SPYGLASS. Its rusted cradle will not turn, but it is already aimed with " +
      "unnerving precision. "
    : "You brace the SPYGLASS against the railing and look through it. ") +
    "The distant BELFRY leaps close: black louvers, a weathered bell, and a narrow maintenance hatch tucked " +
    "inside the roofline. There is plainly more above the ATTIC than rafters. If only you could get onto the ROOF.";
}

function takeSpyglass(ctx) {
  if (ctx.has("spyglass")) return "You already have the spyglass.";
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
    return "Your hands are full. You'll have to drop something before freeing the spyglass.";
  }
  ctx.moveItem("spyglass", "inventory");
  return "You wrench the SPYGLASS from its rusted swivel cradle. Flakes of corrosion fall away, revealing " +
    "the initials BM etched into the brass. This is unmistakably a Blackwood heirloom.";
}

function oakLiftTick(ctx) {
  if (!ctx.getFlag("oakLightAligned")) return null;
  if (ctx.getFlag("oakLiftGrace")) {
    ctx.setFlag("oakLiftGrace", false);
    return null;
  }
  const from = ctx.roomOf("oakPlatform");
  const to = from === "greatOak" ? "treeFort" : "greatOak";
  ctx.moveItem("oakPlatform", to);
  const riding = ctx.getFlag("oakLiftRiding") && ctx.state.room === from;
  if (ctx.getFlag("oakLiftRiding")) ctx.setFlag("oakLiftRiding", false);
  if (riding) {
    ctx.state.room = to;
    const motion = to === "treeFort"
      ? "The pulley catches the white beam. The PLATFORM rises through the branches and settles beside the TREE FORT."
      : "The beam shifts. The PLATFORM descends through the leaves and settles among the GREAT OAK'S roots.";
    return motion + "\n\n" + ctx.describeRoom();
  }
  if (ctx.state.room === "greatOak" || ctx.state.room === "treeFort") {
    return to === "treeFort"
      ? "Ropes hiss overhead as the empty PLATFORM rises toward the TREE FORT."
      : "The empty PLATFORM descends through the leaves to the GREAT OAK'S roots.";
  }
  return null;
}

const SICK_DEATH =
  "After the tenth complete lap, your body has expelled everything it ever contained and several things it never did. " +
  "You collapse — hollow, dehydrated, lightly singed, and profoundly undignified — on the floor of a haunted house.";
// --- Per-turn world tick: burn-up + food afflictions -------------------------
function afflictionTick(ctx) {
  const out = [];
  const hi = ctx.getFlag("high") || 0;
  if (hi > 0) {
    if (ctx.getFlag("highGrace")) {
      ctx.setFlag("highGrace", false);
    } else {
      const left = hi - 1;
      ctx.setFlag("high", left);
      if (left <= 0) {
        out.push(hasDarkVision(ctx)
          ? "The trip loosens its grip and the grey fades — but the XRAY GOGGLES keep the dark legible."
          : "The trip loosens its grip. The grey light fades and the dark closes back in; your third eye shuts.");
      } else {
        out.push(cycleFlavor(ctx, "mushroomHigh"));
      }
    }
  }
  const sick = ctx.getFlag("sick") || 0;
  if (sick > 0) {
    if (ctx.getFlag("sickGrace")) {
      ctx.setFlag("sickGrace", false);
      return out.length ? out.join("\n") : null;
    }
    const phase = (SICK_DURATION - sick) % DIGESTIVE_PHASES.length;
    const left = sick - 1;
    ctx.setFlag("sick", left);
    ctx.setFlag("digestivePhase", phase);
    out.push(cycleFlavor(ctx, ["sickBurp", "sickBarf", "sickFart", "sickPoop"][phase]));
    if (SICK_EVENT_ART[phase]) out.push(MAP_MARK + SICK_EVENT_ART[phase] + MAP_MARK);

    if (ctx.getFlag("fartIgnitionQueued")) {
      if (!ctx.has("burritoWrapper")) {
        ctx.setFlag("fartIgnitionQueued", false);
        out.push("Without the foil wrapper in your hands, the self-lighting plan is cancelled.");
      } else if (phase === 2 || phase === 3) {
        out.push(igniteSelf(ctx, "fart", false, phase));
      }
    }

    if (left <= 4 && left > 0)
      out.push("You are dangerously dehydrated. Find a TOILET or drink the MILK NOW.");
    if (left === 0) out.push(ctx.kill(SICK_DEATH));        // ten complete four-beat cycles
  }
  return out.length ? out.join("\n") : null;
}
function worldTick(ctx) {
  const parts = [];
  const b = burnTick(ctx);          // may kill you
  if (b) parts.push(b);
  if (ctx.state.dead) return parts.join("\n\n");
  const a = afflictionTick(ctx);    // may also kill you (sickness runs its course)
  if (a) parts.push(a);
  if (ctx.state.dead) return parts.join("\n\n");
  const l = lightningTick(ctx);     // random manor-wide teleport (may also kill you)
  if (l) parts.push(l);
  const g = mushroomRegrowTick(ctx); // small per-turn chance the toilet hole regrows
  if (g) parts.push(g);
  const f = foreshadowTick(ctx);     // ambient dread from below, ramping with reliquary deposits
  if (f) parts.push(f);
  const o = oakLiftTick(ctx);         // mirrored-sunlight lift between the oak roots and tree fort
  if (o) parts.push(o);
  return parts.length ? parts.join("\n\n") : null;
}

const FORESHADOW_OPEN = [
  "A telephone is RINGING, faint and insistent, somewhere below the floor. It does not stop.",
  "From under the flagstones: a muffled voice, mid-sentence, giving someone very bad advice.",
  "The open stair breathes up a smell of stale coffee, mushrooms, and hot electronics.",
  "The RINGING below answers itself. A tired voice says, \"Blackwood Manor Hint Line,\" then falls silent.",
  "A phone rings beneath the open stair, stops, and immediately begins again with bureaucratic patience.",
  "From below comes the clatter of a receiver, a swallowed curse, and someone saying your name.",
  "The stairwell carries up a voice arguing about a statue, a key, and whether any of this is worth ninety-nine cents.",
  "RINGING shudders through the flagstones. The sound is close enough now to feel in your teeth.",
  "A desk chair scrapes below. Footsteps approach the bottom of the stair, stop, and retreat.",
  "The smell of old burrito, damp mushrooms, and hot plastic rolls up from the darkness.",
  "A man beneath the house whispers, \"Don't come down here,\" then hurriedly answers another ringing phone.",
  "The open stair glows with weak electric light while a rotary dial spins somewhere out of sight.",
];
const FORESHADOW_MID = [
  "Far off — below you, impossibly — a telephone rings once, then stops.",
  "A voice murmurs somewhere under the house. You catch one word: \"...statue...\" Then nothing.",
  "Faint BELLS, and beneath them a scritch-scratch, like a pen writing very fast.",
  "Under the floor, a receiver clacks into its cradle. A man mutters, \"Unbelievable.\"",
  "A distant voice says, \"No, the other key,\" with the exhausted certainty of repetition.",
  "The stone beneath you vibrates with the thin buzz of a phone left off the hook.",
  "Somewhere below, a drawer slams and a hungry voice accuses someone named Denise.",
  "Three muted rings travel up through the walls. On the fourth, someone answers.",
  "A scratchy voice recites directions beneath the floor, then coughs and starts over.",
  "Warm dust rises from a seam in the flagstones, carrying the smell of burnt coffee.",
  "A tiny bell jingles below, followed by furious scribbling and the click of a pen.",
  "You catch a muffled fragment through the stone: \"...ninety-nine cents...\"",
];
const FORESHADOW_EARLY = [
  "Somewhere in the walls: a dry scritch-scratch, there and gone.",
  "A tiny, far-off ringing, like a phone in another house. It stops the moment you listen.",
  "A cold draught carries the ghost of a voice, too faint to make out.",
  "A floorboard behind you creaks under a weight that is not there.",
  "Something taps twice inside the wall, pauses, then seems to write the answer down.",
  "The pipes carry a thread of conversation from impossibly far away. It ends before the words arrive.",
  "A bell gives one soft, uncertain note somewhere deeper in the house.",
  "For a moment, the silence has the papery texture of someone turning a page.",
  "A faint electrical hum passes beneath your feet and vanishes into the stone.",
  "You hear a receiver lift from its cradle in a room that cannot be nearby.",
  "The wall exhales stale coffee and dust, then becomes only a wall again.",
  "Somewhere below, a chair squeaks and a tired man sighs. Or the house settles.",
];

// Ambient foreshadowing for the secret Gary ending: a scritch-scratch, faint
// bells, a far-off voice — intensifying as the reliquary fills, and turning into
// an insistent telephone RINGING once the family collection is complete and the floor
// stair has opened. Gated behind the same chaos kill-switch as lightning, and
// silent until you've begun filling the reliquary — so it never fires in the
// deterministic canonical/early-game tests.
function foreshadowTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null;       // deterministic test harness kill-switch
  if (!ctx.getFlag("frontDoorOpen")) return null;  // only stirs once you're inside
  const dep = depositedFamilyItemCount(ctx);
  if (dep < 1) return null;                         // the house only wakes as the reliquary fills
  const open = ctx.getFlag("floorDoorOpen");
  const chance = open ? 0.5 : Math.min(0.35, 0.06 + dep * 0.03);
  if (Math.random() >= chance) return null;
  const poolName = open ? "foreshadowOpen" : dep >= 6 ? "foreshadowMid" : "foreshadowEarly";
  return cycleFlavor(ctx, poolName);
}

// --- ASCII status art stamped onto every room description --------------------
const FIRE_ART = [
  "        )   (   )",
  "       (   ) (   )      🔥  Y O U   A R E   O N   F I R E  🔥",
  "        ) (   ) (",
  "      _(___)_(___)_",
].join("\n");
const SICK_ART = [
  "     \\o/   ~ B L E A R G H ~     BURP 🫧 · BARF 🤮 · FART 💨 · POOP 💩",
  "      |    ~ ~ ~",
  "     / \\   . : . : .",
].join("\n");
// Stamped into the WEAR response when you lace on the golden WINGED SHOES — a
// pair of Hermes-style sandals with feathered wings beating at the ankles.
const WINGED_SHOES_ART = [
  "      __/\\__                  __/\\__",
  "   \\-'      '-/            \\-'      '-/",
  "    '-.____.-'              '-.____.-'",
  "     /______\\                /______\\",
  "    [________]              [________]",
  "  ~ ~ ~  THE WINGED SHOES LIFT YOUR HEELS OFF THE FLOOR  ~ ~ ~",
].join("\n");
// Stamped into the secret Gary-cliffhanger ending — his squalid basement
// call-cave, the moment before the rotary phone meets your skull.
const GARY_LAIR_ART = [
  "   ___________________",
  "  | GARY'S CALL-CAVE  |",
  "  |   ___    ((=TEL   |",
  "  |  (o o)   burrito  |",
  "  |  /|_|\\   milk mush|",
  "  |__||_______________|",
  "     \"FREEDOM!\" ...click",
].join("\n");
// The digestive doomsday clock: a nasty bowel-pressure gauge that FILLS as the
// burrito marches you toward fatal explosive diarrhea. `sick` counts down from
// SICK_DURATION (freshly eaten) to 0 (detonation), so pressure = how much has
// already built up. Rendered under the sick art every turn you're afflicted.
const GAUGE_WIDTH = 18;
function digestiveGauge(ctx) {
  const status = digestiveStatus(ctx);
  if (!status) return "";
  const { remaining, pressure, percent: pct } = status;
  const filled = Math.min(GAUGE_WIDTH, Math.round((pressure / SICK_DURATION) * GAUGE_WIDTH));
  const bar = "█".repeat(filled) + "░".repeat(GAUGE_WIDTH - filled);
  let label;
  if (pct < 20) label = "ominous gurgling";
  else if (pct < 40) label = "churning, wet and low";
  else if (pct < 60) label = "roiling — the sphincter is on notice";
  else if (pct < 80) label = "CLENCHED — do NOT sneeze";
  else if (pct < 95) label = "🚨 EVACUATE — detonation imminent";
  else label = "🚨🚨 T-MINUS SPLASHDOWN 🚨🚨";
  return `💩 BOWEL PRESSURE ▐${bar}▌ ${pct}%  (~${remaining} turns to blast)\n   ≈ ${label} ≈`;
}
function digestiveStatus(ctx) {
  const remaining = ctx.getFlag("sick") || 0;
  if (remaining <= 0) return null;
  const pressure = SICK_DURATION - remaining;
  const phaseIndex = ctx.getFlag("digestivePhase") ?? (pressure % DIGESTIVE_PHASES.length);
  return {
    remaining,
    pressure,
    percent: Math.min(100, Math.round((pressure / SICK_DURATION) * 100)),
    phaseIndex,
    ...DIGESTIVE_PHASES[phaseIndex],
  };
}
function statusBanner(ctx) {
  const parts = [];
  if (ctx.getFlag("onFire")) parts.push(FIRE_ART);
  if ((ctx.getFlag("sick") || 0) > 0) { parts.push(SICK_ART); parts.push(digestiveGauge(ctx)); }
  return parts.length ? parts.join("\n") : "";
}

function discoverBetweenWalls(ctx) {
  if (ctx.getFlag("seen:betweenWalls")) {
    ctx.setFlag("progressAward:betweenWalls");
    return 0;
  }
  return awardProgress(ctx, "betweenWalls");
}

// --- Random teleport, shared by the mystery package and lightning jumps ------
// Picks any room but the one you're standing in. Reuses the crypt/wraith
// safeguard so an unlucky draw can genuinely kill you, same as walking in on
// purpose without the talisman.
function teleportRandom(ctx, flavor, exclude) {
  const ids = Object.keys(ctx.world.rooms).filter(
    (id) => id !== ctx.state.room && !(exclude && exclude.has(id))
  );
  const roomId = ids[Math.floor(Math.random() * ids.length)];
  ctx.state.room = roomId;
  if (roomId === "crypt") {
    const talisman = ctx.item("talisman");
    if (!(talisman && talisman.loc === "inventory" && talisman.worn)) {
      return `${flavor}\n\n` + ctx.kill(
        "You reappear in the CRYPT with a graceless thud — no warning, no weightlessness, nothing to soften it. " +
        "The WRAITH is on you before your eyes adjust, and your heart simply stops."
      );
    }
  }
  const betweenWallsPoints = roomId === "betweenWalls" ? discoverBetweenWalls(ctx) : 0;
  if (roomId === "betweenWalls") ctx.setFlag("seen:betweenWalls", true);
  const landing = roomId === "betweenWalls"
    ? "You don't so much land as get FILED somewhere the house forgot to build.\n\n"
    : `You land, with a graceless thump, in ${ctx.world.rooms[roomId].name.toUpperCase()}.\n\n`;
  return `${flavor}\n\n${landing}${ctx.describeRoom()}` +
    (betweenWallsPoints
      ? `\n\n(A place no proper door leads to. Almost nobody finds this on purpose. +${betweenWallsPoints}.)`
      : "");
}

// --- Copilot's Mystery Package: a gift-wrapped box that does NOT want to be
// opened. Seven possible outcomes, evenly weighted, roughly half good news and
// half catastrophe — including the two ways to become instantly on fire AND
// sick at once, and a rare shortcut into the hidden space between the walls.
// Every effect and destination also has a deterministic route elsewhere.
const PACKAGE_EFFECTS = [
  // 1. Cure whatever ails you.
  (ctx) => {
    const wasSick = (ctx.getFlag("sick") || 0) > 0;
    const was = wasSick || (ctx.getFlag("high") || 0) > 0;
    ctx.setFlag("sick", 0); ctx.setFlag("high", 0);
    ctx.setFlag("sickGrace", false); ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("digestivePhase", null);
    ctx.addScore(3);
    return "A warm, golden light spills out of the box and washes over you like your mother checking your " +
      "forehead for a fever." + (was
        ? " Whatever was wrong with you a second ago simply... isn't, anymore. Miraculous. Suspicious. (+3)"
        : " You feel great, if a little cheated that nothing was wrong with you to begin with. (+3)") +
      surviveBurrito(ctx, wasSick);
  },
  // 2. Instant burrito-grade sickness, no burrito required.
  (ctx) => {
    ctx.setFlag("sick", SICK_DURATION);
    ctx.setFlag("sickGrace", true);
    ctx.setFlag("digestivePhase", 0);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("ateBurrito", true);
    return "A wet, meaty stench rolls out of the box, like Gary's burrito has been marinating in there since " +
      "the dawn of time. Your stomach drops. This is going to be a whole THING.";
  },
  // 3. Random teleport — anywhere in the manor, including nowhere at all.
  (ctx) => {
    const excluded = ctx.getFlag("oakLightAligned") ? new Set() : new Set(["treeFort"]);
    return teleportRandom(ctx, "The box hums, the floor tilts sideways, and reality politely excuses itself.", excluded);
  },
  // 4. A small, undeserved windfall.
  (ctx) => {
    ctx.addScore(10);
    return "A single, absurdly lucky coin rolls out, glints once, and posts itself directly into your pocket. " +
      "You feel weirdly, unearnedly blessed. (+10)";
  },
  // 5. Spontaneous combustion.
  (ctx) => {
    if (ctx.getFlag("onFire"))
      return "The box smoulders threateningly. You are already on fire, so: no meaningful change.";
    ctx.setFlag("onFire", true);
    return "The box IGNITES in your hands with a WHUMP like a struck match the size of a dog. You are, once " +
      "again, ON FIRE.";
  },
  // 6. The one the card was warning you about: flaming diarrhea, immediately.
  (ctx) => {
    ctx.setFlag("sick", SICK_DURATION);
    ctx.setFlag("sickGrace", true);
    ctx.setFlag("digestivePhase", 0);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("ateBurrito", true);
    ctx.setFlag("onFire", true);
    return "This is, somehow, the single worst possible outcome. FLAMING. DIARRHEA. Immediately, both at once, " +
      "no countdown, no warning. You are on fire AND extremely unwell and cannot decide which problem to " +
      "address first. Neither, probably. Both are bad. Run.";
  },
  // 7. A face full of spores.
  (ctx) => {
    ctx.setFlag("high", (ctx.getFlag("high") || 0) + 10);
    ctx.setFlag("highGrace", true);
    return "A single spore drifts out of the box and you inhale it before you can stop yourself. Oh no. Oh no, " +
      "here we go. The walls are breathing again.";
  },
];
function openMysteryPackage(ctx) {
  ctx.destroy("mysteryPackage");
  const effect = PACKAGE_EFFECTS[Math.floor(Math.random() * PACKAGE_EFFECTS.length)];
  return "Against every instinct, and the express written warning on the card, you tear the ribbon and lift " +
    "the lid.\n\n" + effect(ctx);
}

// --- Lightning Jumps: the manor's own random teleport, no wrapping paper -----
// Once you're inside (front door open), every turn has a small chance of a
// bolt of lightning spearing into the floor of whatever room you're standing
// in. It does NOT grab you — it just sits there, crackling, same as the
// mystery package sits in the royal hall: you have to choose to TOUCH it. If
// you do, it teleports you to a random ORDINARY room. Unlike the mystery
// package, the bolt refuses to drop you into the manor's special or guarded
// spaces (LIGHTNING_NO_JUMP below) — no free jumps into secret rooms, hidden
// vaults, the crypt wraith, the endgame sanctum, or the dragon's gold. It is a
// nuisance that relocates you, not a shortcut past a puzzle. Left alone, the
// bolt is USE-IT-OR-LOSE-IT: it fizzles on the very next turn. While you're
// high on the mushrooms, it still can't grab hold of you at all — touching it
// does nothing, since you keep your own steering (FLY TO / FLOAT TO any room by
// name) instead.
const LIGHTNING_CHANCE = 1 / 11; // ~1 in 11 turns (was 0.15, ~1 in 6.7 — too frequent)
const LIGHTNING_FUSE = 1; // use it or lose it: the bolt is gone on the very next turn
// Rooms the lightning bolt will never dump you into: secret/hidden spaces, the
// win-critical hollow wing, the wraith crypt, and guarded treasure vaults.
// Reaching these is meant to be earned, not handed to you by a lucky bolt. (The
// mystery package is exempt — its whole gag is that anything can happen.)
const LIGHTNING_NO_JUMP = new Set([
  "betweenWalls",  // the secret room (+20) — earn it via the wall gap
  "hiddenVault",   // hidden obsidian-eye vault
  "hollowPassage", // hidden endgame wing
  "hollowSanctum", // hidden endgame wing — you can WIN from here
  "secretChamber", // hidden grimoire chamber
  "crypt",         // the wraith death-room + gold locket
  "dreadmawVault", // the dragon's treasure vault (family crest and winged shoes)
  "treeFort",      // required heirloom behind the GREAT OAK lift puzzle
  "garysLair",     // the secret cliffhanger ending — reached on foot, never by a lucky bolt
]);
const LIGHTNING_FLAVORS = [
  "LIGHTNING CRACKS somewhere far too close, and the air suddenly tastes like a dropped fork on a battery.",
  "Every loose metal object in the room jumps at once as LIGHTNING detonates with a flat, brutal SNAP.",
  "The lights dim, the hairs on your arms rise, and LIGHTNING answers a question nobody asked.",
  "A blue-white flash erases the room for an instant. LIGHTNING leaves the smell of pennies and rain.",
  "Static crawls over your teeth. Then LIGHTNING hits close enough to make the walls flinch.",
  "The manor holds its breath. LIGHTNING tears the silence in half.",
  "A thunderclap punches dust from the ceiling as LIGHTNING arrives indoors without knocking.",
  "Your vision goes negative for one bright second. LIGHTNING has chosen this room.",
  "The air tightens like a wire, then LIGHTNING cracks it open.",
  "Somewhere overhead, the sky makes a clerical error and files LIGHTNING directly into the house.",
  "A spark races along the floorboards ahead of a LIGHTNING blast that shakes the room.",
  "There is a sharp ozone stink, a white flash, and the unmistakable report of LIGHTNING behaving badly.",
];
const LIGHTNING_ART = [
  "            ⚡",
  "           ╱",
  "          ╱___",
  "              ╲",
  "           ___╲",
  "          ╱",
  "         ╱",
  "        ⚡",
].join("\n");
function lightningTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null; // deterministic test harness kill-switch
  if (!ctx.getFlag("frontDoorOpen")) return null; // the manor's lightning only hunts you once you're inside
  const boltRoom = ctx.getFlag("lightningBoltRoom");
  if (boltRoom) {
    const fuse = (ctx.getFlag("lightningBoltFuse") || 1) - 1;
    if (fuse > 0) { ctx.setFlag("lightningBoltFuse", fuse); return null; } // still crackling, nothing new to say
    ctx.destroy("lightningBolt");
    ctx.setFlag("lightningBoltRoom", null);
    ctx.setFlag("lightningBoltFuse", null);
    return boltRoom === ctx.state.room
      ? "The scorched bolt in the floor finally sputters out, leaving nothing but a smoking black scar."
      : null; // fizzled out somewhere you aren't standing; no need to announce it
  }
  if (Math.random() >= LIGHTNING_CHANCE) return null;
  ctx.moveItem("lightningBolt", ctx.state.room);
  ctx.setFlag("lightningBoltRoom", ctx.state.room);
  ctx.setFlag("lightningBoltFuse", LIGHTNING_FUSE);
  return `${cycleFlavor(ctx, "lightning")}\n\n${MAP_MARK}${LIGHTNING_ART}${MAP_MARK}\n\n` +
    "A jagged bolt of LIGHTNING has speared into the floor right where you're standing, hissing and " +
    "crackling. You could TOUCH it, if you dare.";
}
function touchLightningBolt(ctx) {
  ctx.destroy("lightningBolt");
  ctx.setFlag("lightningBoltRoom", null);
  ctx.setFlag("lightningBoltFuse", null);
  if ((ctx.getFlag("high") || 0) > 0) {
    return "You reach for it, but you're already loose enough from your body that your fingers just drift " +
      "through the crackling light. It sputters out a moment later. (You're high enough to FLY TO or FLOAT " +
      "TO any room you like, any time you like — you don't need the bolt's help.)";
  }
  return teleportRandom(ctx, "You touch the bolt. The world WHITES OUT.", LIGHTNING_NO_JUMP);
}

// --- The privy: use the outhouse hole to end the vomiting & diarrhea ----------
function useToilet(ctx) {
  if ((ctx.getFlag("sick") || 0) > 0) {
    ctx.setFlag("sick", 0);
    ctx.setFlag("sickGrace", false);
    ctx.setFlag("fartIgnitionQueued", false);
    ctx.setFlag("digestivePhase", null);
    return "You reach the TOILET HOLE not one moment too soon. What follows is private, thorough, and — eventually — " +
      "deeply cathartic. You emerge hollow and trembling, but CURED. The burrito's four-stage assault has passed." +
      surviveBurrito(ctx, true);
  }
  if ((ctx.getFlag("high") || 0) > 0)
    return "You squat over the hole and contemplate the mushrooms' birthplace for what may be an hour, or an epoch.";
  return "You don't especially need the TOILET HOLE right now, but you're glad the outhouse has one.";
}
function flushToilet() {
  return "It is a hole in the ground. There is no plumbing and nothing to flush.";
}
function inspectToilet(ctx) {
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!ctx.getFlag("outhouseMushroomsFound")) {
    ctx.setFlag("outhouseMushroomsFound");
    ctx.moveItem("outhouseMushrooms", "privy");
    return "You lean over and LOOK IN the TOILET HOLE. Fresh purple MUSHROOMS are growing directly in a wet " +
      "bed of literal shit and piss. They glow twice as brightly as the dried kitchen ones.";
  }
  if (mushrooms && mushrooms.loc === "privy") {
    return "Inside the TOILET HOLE, the fresh MUSHROOMS remain rooted in literal shit and piss.";
  }
  if (mushrooms && mushrooms.loc === "inventory") {
    return "The TOILET HOLE sits empty — you already pulled this crop free.";
  }
  return "You look into the TOILET HOLE. Only shit, piss, and the torn roots of the last crop remain. The " +
    "muck looks fertile enough that another might push through, given time.";
}
function takeToiletMushrooms(ctx) {
  if (!ctx.getFlag("outhouseMushroomsFound")) {
    return "You stop before reaching blindly into the dark hole. You should LOOK IN THE TOILET first.";
  }
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!mushrooms || mushrooms.loc !== "privy") return "There's nothing to pull free right now — just shit and piss.";
  if (ctx.has("outhouseMushrooms")) return "You already have the fresh mushrooms.";
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity())
    return "Your hands are full. You'll have to drop something before reaching into that.";
  ctx.moveItem("outhouseMushrooms", "inventory");
  return "You reach into the TOILET HOLE and pull the MUSHROOMS free. Your hand comes back coated in literal " +
    "shit and piss. The mushrooms are not cleaner.";
}
function reachIntoToilet(ctx, cmd) {
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (!/\b(toilet|hole|mushroom|fungus)\b/.test(target)) return null;
  return takeToiletMushrooms(ctx);
}
function deriveCommand(ctx, cmd) {
  if (ctx.state.room !== "privy" || ctx.getFlag("outhouseMushroomsFound")) return [];
  if (!["take", "eat", "reach", "use"].includes(cmd.verb)) return [];
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (!/\b(mushroom|mushrooms|fungus|toilet|hole)\b/.test(target)) return [];
  if (cmd.verb === "use" && !/\b(mushroom|mushrooms|fungus)\b/.test(target)) return [];
  inspectToilet(ctx);
  return ["look in toilet"];
}
// Once a batch of fresh mushrooms has actually been EATEN (destroyed), the
// TOILET HOLE has a small per-turn chance of growing a fresh crop — nature's
// own respawn. Taking the mushrooms without eating them (loc "inventory")
// doesn't trigger regrowth; the old batch is still out there, uneaten.
const MUSHROOM_REGROW_CHANCE = 0.1;
const MUSHROOM_REGROW_LINES = [
  "Something stirs in the TOILET HOLE — a fresh crop of purple MUSHROOMS has pushed up through the muck.",
  "A wet popping sound comes from the TOILET HOLE. New purple MUSHROOMS uncurl from the filth.",
  "The muck in the TOILET HOLE bubbles, then presents a fresh cluster of MUSHROOMS like a terrible bouquet.",
  "Fresh MUSHROOMS push through the TOILET HOLE'S sludge with obscene, cheerful determination.",
  "Something purple crowns through the waste below — the TOILET HOLE has grown more MUSHROOMS.",
  "The TOILET HOLE gives a damp little sigh. A new crop of MUSHROOMS now glistens inside.",
  "With a soft series of pops, fresh MUSHROOMS rise from the muck in the TOILET HOLE.",
  "Nature, unsupervised, has refilled the TOILET HOLE with purple MUSHROOMS.",
  "A cluster of MUSHROOMS noses up through the TOILET HOLE, slick with nutrients best left unnamed.",
  "The waste below shifts. Fresh purple MUSHROOMS have returned to the TOILET HOLE.",
  "The TOILET HOLE blooms again, in the worst possible sense: fresh MUSHROOMS stand in the muck.",
  "A slick purple cap breaks the surface, then another. The TOILET HOLE has a fresh batch of MUSHROOMS.",
];
function mushroomRegrowTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null; // deterministic test harness kill-switch
  if (!ctx.getFlag("outhouseMushroomsFound")) return null; // nothing has ever grown here
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!mushrooms || mushrooms.loc !== null) return null; // still growing, in your pocket, or already regrown
  if (Math.random() >= MUSHROOM_REGROW_CHANCE) return null;
  ctx.moveItem("outhouseMushrooms", "privy");
  return ctx.state.room === "privy"
    ? cycleFlavor(ctx, "mushroomRegrowth")
    : null; // regrew somewhere you aren't standing; no need to announce it
}
const SAFE_CODE = "739";
function safeCode(cmd) {
  return `${cmd.dobj || ""} ${cmd.iobj || ""}`.replace(/\D/g, "");
}
function finishOpeningSafe(ctx, source) {
  const safe = ctx.item("safe");
  safe.locked = false;
  safe.open = true;
  ctx.setFlag("safeCodePrompt", false);
  const inside = ctx.itemsIn("safe");
  const points = awardProgress(ctx, "safeOpened");
  return `${source} The safe clicks open` +
    (inside.length ? ", revealing " + inside.map((item) => item.names[0].toUpperCase()).join(", ") + "." : ".") +
    awardSuffix(points);
}
function enterSafeCode(ctx, cmd) {
  if (ctx.roomOf("safe") !== "parlor") return null;
  if (safeCode(cmd) !== SAFE_CODE) return "You dial that combination. The safe remains locked.";
  return finishOpeningSafe(ctx, "You dial seven left, three right, nine left.");
}
function openSafe(ctx, cmd) {
  const safe = ctx.item("safe");
  if (safe.open) return "The safe already stands open.";
  const suppliedCode = safeCode({ dobj: null, iobj: cmd.iobj });
  if (safe.locked && suppliedCode) {
    if (suppliedCode !== SAFE_CODE) return "You dial that combination. The safe remains locked.";
    return finishOpeningSafe(ctx, "You dial seven left, three right, nine left.");
  }
  if (safe.locked && !ctx.getFlag("knowsCombo")) {
    ctx.setFlag("safeCodePrompt", true);
    return "The safe has a combination dial. If you know the code, type it now.";
  }
  return finishOpeningSafe(ctx, "You dial the combination from the DIARY — seven left, three right, nine left.");
}

const TROLL_RHYMES = new Set(["more", "door", "floor", "core", "roar", "lore", "shore", "store", "before"]);
const TROLL_REJECTED_RHYMES = new Set([
  "adore", "boar", "bore", "chore", "explore", "fore", "four", "gore",
  "ignore", "oar", "or", "pore", "poor", "pour", "score", "snore",
  "sore", "therefore", "tore", "war", "wore", "yore",
]);
const TROLL_RIDDLE =
  "\"Past this door lie gold and ore,\n" +
  "Old crowns, old bones, and something more.\n" +
  "What fills a dragon's hidden store?\n" +
  "Treasure, terror, blood, and ____.\"";
const DRAGON_REBUKES = [
  {
    fire: true,
    text: "DREADMAW THE DRAGON cracks one eye and breathes a sheet of dragonfire over you. You are ON FIRE. " +
      "Then she lowers her head across the cave mouth again without moving an inch.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON opens her jaws, releases a cavern-shaking BELCH, and bathes you in burning apple-scented gas. " +
      "You are ON FIRE. She settles back across the cave mouth.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON rises just enough to spin around and unleash a thunderous FLAMING FART directly at you. " +
      "You are ON FIRE. She completes the turn and lies back down across the entrance.",
  },
  {
    text: "DREADMAW THE DRAGON'S tail snaps sideways like a siege engine. It launches you into open air, over the entire " +
      "HEDGE MAZE, and back to the FRONT GATE in a bruising crash landing.",
  },
  {
    text: "DREADMAW THE DRAGON swats you with one enormous foreclaw. You achieve involuntary flight across the GROUNDS and " +
      "crash beside the FRONT GATE, battered and several opinions poorer.",
  },
  {
    text: "DREADMAW THE DRAGON flicks you with the tip of her nose. The casual gesture sends you cartwheeling over the HEDGE " +
      "MAZE before you crater into the gravel at the FRONT GATE.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON snorts in her sleep. Two furnace-bright jets catch you squarely and set every loose " +
      "thread blazing. You are ON FIRE. She does not wake.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON sneezes. The resulting fireball rolls over you, ricochets off the cave roof, and " +
      "leaves you ON FIRE. She smacks her lips and keeps sleeping.",
  },
  {
    fire: true,
    text: "DREADMAW THE DRAGON lifts one wing and fans a lazy breath of flame across the cave mouth. You are ON " +
      "FIRE. The wing folds shut like a curtain.",
  },
  {
    text: "DREADMAW THE DRAGON exhales without flame, and the hurricane force alone peels you off the ground, " +
      "blows you backward through the HEDGE MAZE, and deposits you at the FRONT GATE.",
  },
  {
    text: "DREADMAW THE DRAGON rolls over. One armored shoulder catches you like a landslide and sends you " +
      "skipping across the GROUNDS to the FRONT GATE.",
  },
  {
    text: "DREADMAW THE DRAGON lets out a sleepy ROAR. The pressure wave fires you through the cave mouth, over " +
      "the HEDGE MAZE, and into the FRONT GATE with gravel in places gravel should not be.",
  },
];

function defineCyclingFlavorPools(pools) {
  for (const [name, pool] of Object.entries(pools)) {
    if (pool.length !== 12) throw new Error(`Cycling flavor pool "${name}" must contain exactly 12 entries.`);
  }
  return Object.freeze(Object.fromEntries(
    Object.entries(pools).map(([name, pool]) => [name, Object.freeze([...pool])])
  ));
}

export const CYCLING_FLAVOR_POOLS = defineCyclingFlavorPools({
  hunger: HUNGER,
  deflect: DEFLECT,
  stageIntros0: STAGE_INTROS[0],
  stageIntros1: STAGE_INTROS[1],
  stageIntros2: STAGE_INTROS[2],
  stageIntros3: STAGE_INTROS[3],
  therapyAsides: THERAPY_ASIDES,
  signoffs0: SIGNOFF_STAGE[0],
  signoffs1: SIGNOFF_STAGE[1],
  signoffs2: SIGNOFF_STAGE[2],
  signoffs3: SIGNOFF_STAGE[3],
  waterOffers: WATER_OFFERS,
  mushroomHigh: HIGH_LINES,
  sickBurp: SICK_BURP_LINES,
  sickBarf: SICK_BARF_LINES,
  sickFart: SICK_FART_LINES,
  sickPoop: SICK_POOP_LINES,
  foreshadowEarly: FORESHADOW_EARLY,
  foreshadowMid: FORESHADOW_MID,
  foreshadowOpen: FORESHADOW_OPEN,
  lightning: LIGHTNING_FLAVORS,
  mushroomRegrowth: MUSHROOM_REGROW_LINES,
  dragonRebukes: DRAGON_REBUKES,
});

function dragonFire(ctx) {
  const outcome = cycleFlavor(ctx, "dragonRebukes");
  if (outcome.fire) {
    ctx.setFlag("onFire", true);
    ctx.setFlag("burnTurns", 0);
    ctx.setFlag("burnGrace", true);
  } else {
    ctx.state.room = "gate";
    ctx.setFlag("dragonInjuries", (ctx.getFlag("dragonInjuries") || 0) + 1);
    ctx.addScore(-3);
  }
  return outcome.text;
}
function talkToDragon(ctx) {
  if (ctx.getFlag("dragonFriendly")) {
    return "DREADMAW lowers her vast head companionably. \"The centuries are long, little apple-bringer. " +
      "Do try not to spend the doubloon somewhere vulgar. The troll inside handles visitors now.\"";
  }
  return dragonFire(ctx);
}
function wakeDragon(ctx) {
  if (ctx.getFlag("dragonFriendly")) return talkToDragon(ctx);
  return dragonFire(ctx);
}
function spokenLine(cmd) {
  const raw = (cmd.dobj || cmd.iobj || "").replace(/^['"]+|['"]+$/g, "");
  const spoken = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "...";
  return `"${spoken}"`;
}
function sayNearDragon(ctx, cmd) {
  if (ctx.getFlag("dragonFriendly")) return spokenLine(cmd) + "\n" + talkToDragon(ctx);
  return spokenLine(cmd) + "\n" + dragonFire(ctx);
}
function giveDragon(ctx, cmd) {
  const offered = ctx.find(cmd.dobj, ctx.inventory());
  if (!offered || offered.id !== "apple") return "DREADMAW does not stir. Perhaps offer her something worth waking for.";
  ctx.destroy("apple");
  ctx.setFlag("dragonAwake");
  ctx.setFlag("dragonMoved");
  ctx.setFlag("dragonFriendly");
  ctx.moveItem("goldDoubloon", "inventory");
  ctx.addScore(STANDALONE_MAX_AWARDS.dreadmaw);
  return "You offer the APPLE. One immense golden eye opens. DREADMAW THE DRAGON eats it with exquisite care, " +
    "then rises and coils beside the cave instead of across it.\n\n" +
    "\"At last, a visitor with manners,\" she says. \"Take this GOLD DOUBLOON. You may enter. " +
    "The troll inside decides who reaches the hoard.\" (+10)";
}
function talkToTroll(ctx) {
  if (ctx.getFlag("dragonVaultOpen")) {
    return "The TROLL stands aside from the open VAULT DOOR. \"You solved it. Go admire the loot.\"";
  }
  ctx.setFlag("trollAskedRiddle");
  return "The TROLL scratches one stone-hard ear. \"No coin, no combat. Finish the missing word and I move.\"\n\n" +
    TROLL_RIDDLE;
}
function openTrollVault(ctx, answer, anticipated = false) {
  ctx.setFlag("trollWrongGuesses", 0);
  ctx.setFlag("trollAskedRiddle");
  ctx.setFlag("dragonVaultOpen");
  const points = awardProgress(ctx, "trollRiddleSolved");
  if (anticipated) {
    return `You say ${answer.toUpperCase()}. The TROLL's eyebrows climb toward his craggy hairline. ` +
      "\"You answered before I even asked. Nobody does that.\"\n\n" +
      "He laughs, genuinely delighted, and lumbers aside. Deep locks answer one another inside the mountain, " +
      "and the vault door rolls open." + awardSuffix(points);
  }
  return `You answer ${answer.toUpperCase()}. The TROLL grins, pleased by the rhyme, and lumbers aside. ` +
    "Deep locks answer one another inside the mountain, and the vault door rolls open." + awardSuffix(points);
}
function answerTrollRiddle(ctx, cmd) {
  if (ctx.getFlag("dragonVaultOpen")) return talkToTroll(ctx);
  const addressed = cmd.iobj ? ctx.find(cmd.iobj) : null;
  const spoken = addressed?.id === "caveTroll"
    ? (cmd.dobj || "")
    : `${cmd.dobj || ""} ${cmd.iobj || ""}`;
  const words = spoken.trim().toLowerCase().match(/[a-z]+/g) || [];
  const answer = words.at(-1) || "";
  if (!ctx.getFlag("trollAskedRiddle")) {
    if (TROLL_RHYMES.has(answer)) return openTrollVault(ctx, answer, true);
    if (addressed?.id === "caveTroll") {
      return `(talk to TROLL)\n\n${talkToTroll(ctx)}`;
    }
    return "The TROLL folds his arms across the VAULT DOOR. Perhaps TALK TO TROLL before shouting answers.";
  }
  if (!TROLL_RHYMES.has(answer)) {
    const rejection = TROLL_REJECTED_RHYMES.has(answer)
      ? "It does rhyme, but it is not the word the TROLL is looking for."
      : "It does not rhyme with the TROLL's verse.";
    const wrongGuesses = (ctx.getFlag("trollWrongGuesses") || 0) + 1;
    if (wrongGuesses >= 3) {
      ctx.setFlag("trollWrongGuesses", 0);
      ctx.setFlag("trollAskedRiddle", false);
      ctx.state.room = "gate";
      return `You offer "${answer || "..."}." ${rejection} The TROLL holds up three stony fingers. "Three wrong answers." ` +
        "He stamps one enormous foot, the tunnel folds inside out, and you tumble onto the gravel at the FRONT GATE.";
    }
    ctx.setFlag("trollWrongGuesses", wrongGuesses);
    const remaining = 3 - wrongGuesses;
    return `You offer "${answer || "..."}." ${rejection} He does not move. ` +
      `${remaining === 1 ? "One guess remains." : `${remaining} guesses remain.`}`;
  }
  return openTrollVault(ctx, answer);
}

// --- End-screen achievement badges -------------------------------------------
export const END_AWARDS = Object.freeze([
  Object.freeze({
    id: "helpless",
    points: 15,
    qualifies: (ctx) =>
      !ctx.getFlag("usedMap") && !ctx.getFlag("usedGaryHelp") && !ctx.getFlag("usedHelp"),
    text: "🆘 BADGE: \"Helpless\" — you escaped without MAP, Gary's hint line, or HELP. (+15)",
  }),
  Object.freeze({
    id: "extraSuperDuperHelpless",
    points: 20,
    qualifies: (ctx) =>
      !ctx.getFlag("usedMap") && !ctx.getFlag("usedGaryHelp") && !ctx.getFlag("usedHelp")
      && !ctx.getFlag("usedInspection"),
    text: "🙈 BADGE: \"Extra Super Duper Helpless\" — you also never used LOOK, EXAMINE, or SEARCH. (+20)",
  }),
  Object.freeze({
    id: "noTakebacks",
    points: 10,
    qualifies: (ctx) => !ctx.getFlag("usedSaveRestore"),
    text: "⏩ BADGE: \"No Takebacks\" — you finished without an explicit SAVE or RESTORE. (+10)",
  }),
]);

function endBadges(ctx) {
  const b = [];
  if (ctx.getFlag("onFire"))
    b.push("🔥 BADGE: \"Out Of The Frying Pan\" — you escaped Blackwood Manor WHILE STILL ON FIRE. Gary is, for once, speechless.");
  if (ctx.getFlag("brazierMethod") === "body")
    b.push("🕯️ BADGE: \"The Old Ways\" — you lit the ceremonial brazier with your own burning body.");
  else if (ctx.getFlag("brazierMethod") === "candle")
    b.push("🕯️ BADGE: \"Patient Flame\" — you coaxed the ceremonial brazier alight with the candlestick.");
  if ((ctx.getFlag("maxBurnTurns") || 0) >= 4)
    b.push("🥵 BADGE: \"Slow Burn\" — you stayed ablaze for " + ctx.getFlag("maxBurnTurns") + " turns and lived to tell it.");
  if (ctx.getFlag("drankMilk"))
    b.push("🥛 BADGE: \"Got Milk?\" — you found the one thing in that kitchen worth drinking.");
  let earned = ctx.getFlag("endAwardsEarned");
  if (!Array.isArray(earned)) {
    earned = END_AWARDS.filter((award) => award.qualifies(ctx)).map((award) => award.id);
    ctx.setFlag("endAwardsEarned", earned);
    ctx.addScore(END_AWARDS
      .filter((award) => earned.includes(award.id))
      .reduce((total, award) => total + award.points, 0));
  }
  for (const award of END_AWARDS) {
    if (earned.includes(award.id)) b.push(award.text);
  }
  return b.length ? "\n\n" + b.join("\n") : "";
}

const ROOM_ART = {
  gate: [
    "          /\\",
    "     ____/  \\____",
    "    /   BLACKWOOD \\",
    "===|_|_|========|_|===",
    "       ||      ||",
  ].join("\n"),
  garden: [
    "      _[]_       ____",
    "     / || \\     /    \\",
    "       ||      |  ()  |",
    "    __/  \\__    \\____/",
    "  ~~ weeds ~~     ||",
  ].join("\n"),
  privy: [
    "      _______",
    "     /       \\",
    "    |  _____  |",
    "    | /  O  \\ |",
    "    |/_______\\|",
  ].join("\n"),
  porch: [
    "   ______________",
    "  /              \\",
    " | [MAIL]  ||||| |",
    " |         | + | |",
    "_|_________|___|_|_",
  ].join("\n"),
  grandHall: [
    "       ( BELL )",
    "          |",
    "     _____|_____",
    "    /  /     \\  \\",
    "   /__/_______\\__\\",
    "      [|||||]",
  ].join("\n"),
  parlor: [
    "    .------------.",
    "    |   .----.   |",
    "    |  / o  o \\  |",
    "    |  \\  --  /  |",
    "    '----||------'",
  ].join("\n"),
  library: [
    "  |[]|[]|[]|[]|",
    "  |[]|[]|==|[]|",
    "  |[]|[]|()|[]|",
    "  |[]|[]|==|[]|",
    "  '-------------'",
  ].join("\n"),
  secretChamber: [
    "      ________",
    "     /  ____  \\",
    "    |  | /\\ |  |",
    "    |  |/==\\|  |",
    "    |___LECT___|",
  ].join("\n"),
  diningRoom: [
    "  __________________",
    " |                  |",
    " |       \\ | /      |",
    " |________\\|/_______|",
    "          /_\\",
  ].join("\n"),
  kitchen: [
    "  [MATCH]       __",
    "     |         /__\\",
    "   __|__      |____|",
    "  | O  O|   __[____]__",
    "  |_____|  | CELLAR  |",
  ].join("\n"),
  wineCellar: [
    " |o| |o| |o| |o|",
    " | | | | | | | |",
    " |o| |o| |o| |o|",
    " |_______________|",
    "       /____\\",
  ].join("\n"),
  crypt: [
    "       .-^-.",
    "    .-'     '-.",
    "   /  _______  \\",
    "  |  /_______\\  |",
    "  |_____________|",
  ].join("\n"),
  landing: [
    "      _______",
    "     |   o   |",
    "     |   |   |",
    " ____|___|___|",
    "    /_/ /_/",
  ].join("\n"),
  nursery: [
    "    __/\\__       ___",
    " __/ o  o \\__   /_*_\\",
    "   \\_====_/    |_____|",
    "     /  \\        | |",
    "   ROCKING      MUSIC",
  ].join("\n"),
  masterBedroom: [
    "   ______________",
    "  |\\            /|",
    "  | \\__________/ |",
    "  | |    BED   | |",
    "  |_|__________|_|",
  ].join("\n"),
  study: [
    "   ______________",
    "  |  OPEN DIARY  |",
    "  |_____/\\_______|",
    "    |   DESK   |",
    "    |__________|",
  ].join("\n"),
  attic: [
    "       /\\",
    "      /  \\",
    "  ___/____\\___",
    " /  []  /\\   \\",
    "/______/__\\___\\",
  ].join("\n"),
  hollowPassage: [
    "  /|            |\\",
    " / |            | \\",
    "|  |     ->     |  |",
    " \\ |            | /",
    "  \\|____________|/",
  ].join("\n"),
  hollowSanctum: [
    "       .-***-.",
    "     .'  (_)  '.",
    "    /    /|\\    \\",
    "   |     / \\  [ ]|",
    "    \\____NORTH___/",
  ].join("\n"),
  betweenWalls: [
    "||   ?    ?   ||",
    "||  /|   /|   ||",
    "|| / |  / |   ||",
    "||_______watch||",
  ].join("\n"),
};

const IMPLICIT_NAVIGATION = Object.freeze({
  gate: { in: "north", out: null },
  garden: { in: "enter well", out: "west" },
  hedgeMazeGate: { in: "west", out: "east" },
  hedgeMazeKnot: { in: "south", out: "east" },
  hedgeMazeLoop: { in: "east", out: "west" },
  dragonCaveMouth: { in: "east", out: "north" },
  dragonAntechamber: { in: "east", out: "west" },
  mineGallery: { in: "down", out: "west" },
  deepShaft: { in: "east", out: "up" },
  trollGate: { in: "east", out: "west" },
  dreadmawVault: { in: null, out: "west" },
  privy: { in: "enter toilet", out: "west" },
  greatOak: { in: "enter platform", out: "west" },
  treeFort: { in: null, out: "enter platform" },
  porch: { in: "enter door", out: "south" },
  grandHall: { in: "enter secret door", out: "south" },
  parlor: { in: "south", out: "west" },
  library: { in: "down", out: "north" },
  secretChamber: { in: null, out: "up" },
  diningRoom: { in: "south", out: "east" },
  kitchen: { in: "down", out: "north" },
  wineCellar: { in: "south", out: "up" },
  crypt: { in: null, out: "north" },
  landing: { in: "up", out: "down" },
  nursery: { in: null, out: "east" },
  masterBedroom: { in: null, out: "west" },
  hallBedroom: { in: null, out: "south" },
  study: { in: null, out: "north" },
  attic: { in: "north", out: "down" },
  roof: { in: "east", out: "down" },
  belfry: { in: "down", out: "west" },
  hiddenVault: { in: null, out: "south" },
  hollowPassage: { in: "north", out: "south" },
  hollowSanctum: { in: "north", out: null },
  garysLair: { in: "down", out: "up" },
  betweenWalls: { in: null, out: "out" },
});

// ---- the world ---------------------------------------------------------------
export const world = {
  config: {
    start: "gate",
    maxCarry: 6,
    title: "Blackwood Manor",
    requiredFamilyItemCount: REQUIRED_FAMILY_ITEM_COUNT,
    equipmentSlots: ["head", "forehead", "eyes", "feet", "finger", "wrist", "neck", "back"],
  },
  hotline,     // dial-in greeting for the 1-900 hint line (see below)
  hotlineTalk, // conversation handler while you're on the line
  garyTurnInfo, // classifies a hotline turn for the optional LLM voice layer
  phoneRank,   // hall-of-shame bill rank for the end screen
  tick: worldTick,   // per-turn: burn-up timer + food afflictions (may kill)
  statusBanner,      // ASCII fire / sickness art stamped onto room descriptions
  digestiveStatus,   // compact bowel-pressure/phase data for the always-on HUD
  fireStatus,        // remaining burn turns for the always-on HUD
  reliquaryStatus,   // required and non-contributing RELIQUARY deposit counts
  headlampStatus,    // remaining wearable HEADLAMP turns for the HUD
  lightStatus,       // remaining wearable HEADLAMP turns for the HUD
  visionStatus,      // temporary mushroom sight or permanent worn eye equipment
  flightStatus,      // temporary mushroom flight or permanent worn WINGED SHOES
  canFly,            // temporary mushroom flight or worn WINGED SHOES
  hasMushroomVision, // temporary mushroom sight or worn hidden-sight equipment
  hasDarkVision,     // temporary mushroom sight or worn XRAY GOGGLES
  flavorPools: CYCLING_FLAVOR_POOLS,
  itemShortNames: ITEM_SHORT_NAMES,
  roomShortNames: ROOM_SHORT_NAMES,
  nextFlavor: cycleFlavor,
  deriveCommand,     // content-specific missing steps the parser may safely infer
  implicitNavigation: IMPLICIT_NAVIGATION,
  migrateState(state, { savedItems }) {
    const legacyEmberWasDeposited = !savedItems?.spyglass
      && savedItems?.emberStone?.treasure
      && savedItems.emberStone.loc === "reliquary";
    if (legacyEmberWasDeposited) state.items.spyglass.loc = "reliquary";
    const legacyTalismanWasOptional = savedItems?.talisman && !savedItems.talisman.treasure;
    if (legacyTalismanWasOptional
        && (state.items.talisman.loc === "reliquary" || state.flags.curseLiftable)) {
      state.items.talisman.loc = "reliquary";
      state.items.talisman.worn = false;
      state.score += world.items.talisman.points || 0;
    }
    const completedBeforeWatch = state.flags.curseLiftable
      || state.flags.floorDoorOpen
      || state.flags.bellRung
      || state.won;
    const legacyWatchWasOptional = !savedItems?.backwardsWatch?.treasure;
    if (legacyWatchWasOptional) {
      const oldWatchLocation = savedItems?.backwardsWatch?.loc;
      const watchScoreFlag = world.items.backwardsWatch.depositScoreFlag;
      const oldWatchWasClaimed = !!oldWatchLocation && oldWatchLocation !== "betweenWalls";
      if (oldWatchWasClaimed) state.flags[watchScoreFlag] = true;
      if (completedBeforeWatch) {
        state.items.backwardsWatch.loc = "reliquary";
      }
      if (completedBeforeWatch && !oldWatchWasClaimed) {
        state.score = (state.score || 0) + (world.items.backwardsWatch.points || 0);
        state.flags[watchScoreFlag] = true;
      }
    }
    const collectionComplete = Object.entries(world.items)
      .filter(([, definition]) => definition.treasure)
      .every(([id]) => state.items[id]?.loc === "reliquary");
    if (collectionComplete) {
      state.flags.curseLiftable = true;
      state.flags.floorDoorOpen = true;
    }

    const completedProgress = {
      statueKeyRevealed: state.flags.statueMoved,
      frontDoorOpened: state.flags.frontDoorOpen || state.items.frontDoor?.open,
      wellLooted: state.flags.wellLooted,
      cellarOpened: state.flags.cellarOpen || state.items.cellarDoor?.open,
      libraryPassageOpened: state.flags.leverPulled,
      diaryDecoded: state.flags.knowsCombo,
      safeRevealed: state.flags.safeRevealed || state.items.safe?.loc === "parlor",
      safeOpened: state.items.safe?.open,
      wallGapFound: state.flags.wallGapFound,
      musicBoxOpened: state.items.musicBox?.open,
      jewelryBoxOpened: state.items.jewelryBox?.open,
      wraithPassed: state.flags["seen:crypt"],
      oakPanelAligned: state.flags.oakLightAligned,
      trollRiddleSolved: state.flags.dragonVaultOpen,
      reliquarySealed: state.flags.curseLiftable && state.flags.reliquarySealed,
      bellRung: state.flags.bellRung,
      secretDoorOpened: state.flags.secretWingOpen || state.items.secretDoor?.open,
      burritoSurvived: (state.flags.ateSuperBurrito
          || (state.flags.ateBurrito && state.items.burrito?.loc == null))
        && !(state.flags.sick > 0) && !state.dead,
    };
    for (const [id, completed] of Object.entries(completedProgress)) {
      const flag = `progressAward:${id}`;
      if (!completed || state.flags[flag]) continue;
      state.flags[flag] = true;
      state.score = (state.score || 0) + PROGRESS_AWARDS[id];
    }

    if (state.flags["seen:betweenWalls"]) state.flags["progressAward:betweenWalls"] = true;
    const claimedKeys = {
      frontKey: state.items.frontKey?.loc === "inventory"
        || state.flags.frontDoorOpen || state.items.frontDoor?.locked === false,
      tinyKey: state.items.tinyKey?.loc === "inventory"
        || state.items.jewelryBox?.locked === false,
      boneKey: state.items.boneKey?.loc === "inventory"
        || state.flags.secretWingOpen || state.items.secretDoor?.locked === false,
    };
    for (const [id, claimed] of Object.entries(claimedKeys)) {
      const item = world.items[id];
      if (!claimed || !item?.progressPoints || state.flags[item.progressFlag]) continue;
      state.flags[item.progressFlag] = true;
      state.score = (state.score || 0) + item.progressPoints;
    }
  },
  endBadges,         // win-screen achievement badges
  floatTo: floatToRoom,

  rooms: {
    gate: {
      name: "Front Gate",
      art: ROOM_ART.gate,
      desc:
        "You stand at the rusted iron FRONT GATE of BLACKWOOD MANOR as the last light drains " +
        "from the sky. The MANOR looms beyond a dead lawn, its windows like sockets. A " +
        "gravel path leads NORTH to the PORCH. A low wall gives way EAST to the OVERGROWN " +
        "GARDEN, while a black yew opening enters the HEDGE MAZE to the WEST.",
      searchDesc:
        "Fresh scuffs disturb the gravel toward the EASTERN GARDEN. WEST, scorched leaves disappear into the HEDGE MAZE.",
      exits: { north: "porch", east: "garden", west: "hedgeMazeGate" },
    },

    garden: {
      name: "Overgrown Garden",
      art: ROOM_ART.garden,
      desc:
        "Brambles have swallowed what was once a formal GARDEN. A weathered stone STATUE " +
        "of a robed woman leans amid the weeds, and a crumbling WELL shaft plunges into " +
        "blackness. A cold iron BRAZIER stands nearby. An ivy-choked brick OUTHOUSE squats to " +
        "the EAST; the FRONT GATE lies back to the WEST.",
      searchDesc(ctx) {
        if (!ctx.getFlag("statueMoved")) {
          return "The weeds around the leaning STATUE are crushed, and its base has scraped a shallow arc through " +
            "the soil. It looks heavy, but not immovable. The WELL would require a sound ROPE.";
        }
        if (!ctx.getFlag("wellLooted")) {
          return "The disturbed STATUE base has surrendered its secret. Wear on the WELL's lip suggests a ROPE could " +
            "make the descent survivable; old scorch marks around the BRAZIER suggest a much larger flame.";
        }
        return "The STATUE and WELL have yielded what they hid. Only the grave-damp BRAZIER still looks expectant.";
      },
      highDesc:
        "Stone and soil turn translucent. An IRON KEY glints beneath the STATUE, an ANCIENT COIN waits at the " +
        "bottom of the WELL, and old fire sleeps inside the BRAZIER.",
      extraDirections: ["down"],
      exits: { west: "gate", east: "privy" },
      on: {
        // "down" / "go down" / "climb down" all attempt the well.
        go(ctx, cmd) {
          if (cmd.dobj !== "down") return null;
          return descendWell(ctx);
        },
      },
    },

    hedgeMazeGate: {
        name: "Hedge Maze: Yew Gate",
        art: [
          "  ||||||     ||||||",
          "  ||  \\       /  ||",
          "  ||   \\_____/   ||",
          "  ||             ||",
        ].join("\n"),
        desc:
          "Black yew walls swallow the sky. The FRONT GATE is EAST; passages run WEST and SOUTH, both " +
          "already looking suspiciously familiar.",
        searchDesc:
          "Freshly snapped twigs and one enormous scale lie toward the WESTERN PASSAGE.",
        exits: { east: "gate", west: "hedgeMazeKnot", south: "hedgeMazeLoop" },
      },

    hedgeMazeKnot: {
        name: "Hedge Maze: Thorn Knot",
        art: [
          "  >>>>\\     /<<<<",
          "  >>>> \\___/ <<<<",
          "       /   \\",
          "  <<<< /     \\ >>>>",
        ].join("\n"),
        desc:
          "Three thorn corridors knot together beneath clawed branches. The air to the SOUTH smells faintly of apples and smoke.",
        searchDesc:
          "A trail of scorched leaves continues SOUTH. The WESTERN corridor circles toward your own footprints.",
        exits: { east: "hedgeMazeGate", west: "hedgeMazeLoop", south: "dragonCaveMouth" },
      },

    hedgeMazeLoop: {
        name: "Hedge Maze: Crooked Loop",
        art: [
          "  /\\/\\/\\/\\/\\/\\",
          "  \\          /",
          "   \\  LOOP  /",
          "    \\/\\/\\/\\/",
        ].join("\n"),
        desc:
          "The hedge bends back on itself with malicious precision. Every opening resembles the one you just used.",
        searchDesc:
          "Your overlapping footprints prove the NORTHERN opening is a loop; broken thorns point EAST toward the warmer air.",
        exits: { north: "hedgeMazeLoop", east: "hedgeMazeKnot", west: "hedgeMazeGate" },
      },

    dragonCaveMouth: {
        name: "Dreadmaw's Cave Mouth",
        art: [
          "       /\\___/\\",
          "   ___/  -.-  \\___",
          "  /____ DREADMAW ___\\",
          "      \\________/",
        ].join("\n"),
        desc:
          "A CAVE yawns in a basalt hill, but DREADMAW THE DRAGON sleeps across its entrance — an ancient female dragon " +
          "vast enough to serve as the door. The HEDGE MAZE lies NORTH. The CAVE is EAST, entirely blocked by the DRAGON.",
        searchDesc(ctx) {
          return ctx.getFlag("dragonMoved")
            ? "DREADMAW now rests beside the entrance, leaving the PASSAGE EAST open."
            : "Her nostrils smoke in her sleep. She will have to move before anything enters the CAVE.";
        },
        exits: {
          north: "hedgeMazeKnot",
          east: { to: "dragonAntechamber", via: "dragonMoved",
            lockedMsg: "DREADMAW is sleeping across the entire cave mouth. She has to move first." },
        },
        on: { say: sayNearDragon },
      },

    dragonAntechamber: {
        name: "Dragon Cave Antechamber",
        art: [
          "  |\\            /|",
          "  | \\  rails   / |",
          "  |  \\=====>  /  |",
          "  |___\\______/___|",
        ].join("\n"),
        desc:
          "The outer CAVE widens around rusted mine rails and abandoned ore carts. A DUSTY FAMILY RING marked BM " +
          "lies in the grit of one cart. DREADMAW'S CAVE MOUTH is WEST; the tunnel continues EAST into a MINING GALLERY.",
        searchDesc:
          "The initials BM remain visible beneath the dust on the FAMILY RING. The rails vanish EAST beneath old timber braces.",
        exits: { west: "dragonCaveMouth", east: "mineGallery" },
      },

    mineGallery: {
      name: "Mining Gallery",
      art: [
        "  |--|--|--|--|",
        "  |  o==>      |",
        "  |_/|\\________|",
        "    / \\  rails",
      ].join("\n"),
      desc:
        "A timber-braced MINING GALLERY follows a rusted rail line. A battered HEADLAMP hangs from a support post. " +
        "The DRAGON CAVE ANTECHAMBER is WEST; a ladder descends DOWN into a DEEP MINING SHAFT.",
      searchDesc:
        "The HEADLAMP still has a sealed battery pack. The rails and fresher TROLL footprints both continue DOWN.",
      exits: { west: "dragonAntechamber", down: "deepShaft" },
    },

    deepShaft: {
      name: "Deep Mining Shaft",
      art: [
        "  |\\          /|",
        "  | \\   ||   / |",
        "  |  \\  ||  /  |",
        "  |___\\_||_/___|",
      ].join("\n"),
      desc:
        "A DEEP MINING SHAFT drops through wet black stone. Broken ladders and narrow ledges descend between " +
        "abandoned seams. A discarded miner's BACKPACK rests on a dry ledge. The MINING GALLERY is UP; " +
        "a worked tunnel runs EAST to the TROLL GATE.",
      searchDesc:
        "The BACKPACK still looks sturdy despite its years underground. Heavy bare footprints lead EAST.",
      dark: true,
      exits: { up: "mineGallery", east: "trollGate" },
    },

    trollGate: {
      name: "Troll Gate",
      art: [
        "  |\\    TROLL   /|",
        "  | \\  .-^^-.  / |",
        "  |  \\[ DOOR ]/  |",
        "  |___\\______/___|",
      ].join("\n"),
      desc:
        "The tunnel ends at a seamless black VAULT DOOR. A broad, warty TROLL sits directly in front of it. " +
        "The DEEP MINING SHAFT lies WEST; DREADMAW'S hoard is sealed EAST.",
      searchDesc:
        "No keyhole interrupts the VAULT DOOR. The TROLL watches you expectantly, as if waiting to ask something.",
      exits: {
        west: "deepShaft",
        east: { to: "dreadmawVault", via: "dragonVaultOpen",
          lockedMsg: "The inner VAULT DOOR remains sealed behind the TROLL." },
      },
      on: { say: answerTrollRiddle },
    },

    dreadmawVault: {
        name: "Dreadmaw's Vault",
        aliases: ["dreadmaw vault", "dragon hoard", "cave of riches", "hoard"],
        art: [
          "   $  *  $  *  $",
          "  /_____________\\",
          " /_$$_GEMS_$$_*__\\",
          " \\_______________/",
        ].join("\n"),
        desc:
          "Gold rises in dunes beneath a ceiling lost in darkness. Jeweled cups, crowns, and inconveniently " +
          "large gemstones fill DREADMAW'S VAULT. A BLACKWOOD FAMILY CREST rests on a velvet cushion beside " +
          "a pair of WINGED SHOES. The TROLL GATE is WEST.",
        searchDesc:
          "This is generational dragon wealth, not loose change. The BLACKWOOD FAMILY CREST waits apart as the " +
          "essential heirloom; the WINGED SHOES look made to be worn.",
        exits: { west: "trollGate" },
      },

    privy: {
      name: "Ivy-Choked Privy",
      art: ROOM_ART.privy,
      desc:
        "A cramped brick OUTHOUSE strangled in ivy. Its only fixture is a rough wooden seat over a dark " +
        "TOILET HOLE in the earth. Fresh purple MUSHROOMS grow from the filth inside. The GARDEN lies WEST; " +
        "a narrow path continues EAST toward an enormous OAK.",
      searchDesc:
        "There are no pipes, tank, or porcelain — just a load-bearing seat and a TOILET HOLE. The fresh " +
        "source of the faint purple glimmer is somewhere DOWN inside it. You would have to LOOK IN. Sunlight " +
        "flashes strangely through the leaves along the EASTERN path.",
      exits: { west: "garden", east: "greatOak" },
      on: { reach: reachIntoToilet },
    },

    greatOak: {
      name: "The Great Oak",
      aliases: ["great oak", "oak tree", "oak"],
      art: [
        "       /\\  /\\",
        "    __/  \\/  \\__",
        "      ||     ||",
        "      ||     ||",
        "     /_______\\",
      ].join("\n"),
      desc:
        "An immense GREAT OAK towers over a sunlit clearing EAST of the PRIVY. On the trunk's sunward backside, " +
        "a dark iron PANEL is inset beneath a high PULLEY. Tiny mirrors glint among the branches overhead. " +
        "The PRIVY path returns WEST.",
      searchDesc(ctx) {
        const platform = ctx.roomOf("oakPlatform") === "greatOak"
          ? " A wooden PLATFORM is waiting among the roots."
          : ctx.getFlag("oakLightAligned")
            ? " The PLATFORM is currently somewhere above the branches."
            : " The overhead PULLEY hangs far beyond reach.";
        return describeOakPanel(ctx) + platform;
      },
      extraDirections: (ctx) => ctx.roomOf("oakPlatform") === "greatOak" ? ["in"] : [],
      exits: { west: "privy" },
      on: {
        enter(ctx, cmd) {
          return /\b(platform|lift)\b/i.test(cmd.dobj || "") ? enterOakPlatform(ctx) : null;
        },
        climb(ctx, cmd) {
          return /\b(platform|lift)\b/i.test(cmd.dobj || "") ? enterOakPlatform(ctx) : null;
        },
        put: putOakGem,
      },
    },

    treeFort: {
      name: "Blackwood Tree Fort",
      aliases: ["tree fort", "treehouse", "tree house"],
      art: [
        "      __________",
        "     /  FORT   /|",
        "    /________/  |",
        "    | [___]  |  |",
        "    |___||___|__|",
      ].join("\n"),
      desc:
        "A weathered TREE FORT fills the GREAT OAK'S crown. Faded SIGNAL FLAGS, a blanket HIDEOUT, a wooden " +
        "SLINGSHOT, and a crate-table surround a brass SPYGLASS in a rusted swivel cradle. The pulley PLATFORM " +
        "visits the railing every other turn.",
      searchDesc:
        "Child-sized chalk plans cover the planks. The SPYGLASS is unmistakably valuable, and its frozen cradle " +
        "aims directly toward BLACKWOOD MANOR'S distant BELFRY.",
      extraDirections: (ctx) => ctx.roomOf("oakPlatform") === "treeFort" ? ["out"] : [],
      exits: {},
      on: {
        enter(ctx, cmd) {
          return /\b(platform|lift)\b/i.test(cmd.dobj || "") ? enterOakPlatform(ctx) : null;
        },
        climb(ctx, cmd) {
          return /\b(platform|lift)\b/i.test(cmd.dobj || "") ? enterOakPlatform(ctx) : null;
        },
      },
    },

    porch: {
      name: "Front Porch",
      art: ROOM_ART.porch,
      desc:
        "The PORCH boards sag underfoot. A brass MAILBOX is bolted beside a great oak " +
        "FRONT DOOR, its wood black with age. The path returns SOUTH to the FRONT GATE.",
      searchDesc(ctx) {
        const mailbox = ctx.item("mailbox");
        return mailbox && mailbox.open
          ? "The open MAILBOX has no false back. The FRONT DOOR's iron lock is old but functional; it needs a real KEY."
          : "The MAILBOX lid has a finger-worn edge and no lock. The FRONT DOOR's iron keyhole is too large for subtle tools.";
      },
      exits: {
        south: "gate",
        north: { to: "grandHall", via: "frontDoorOpen", lockedMsg: "The front door is shut fast." },
      },
    },

    grandHall: {
      name: "Royal Hall",
      art: ROOM_ART.grandHall,
      desc:
        "A vast, cobwebbed ROYAL HALL rises two storeys to a shattered chandelier. A royal " +
        "staircase climbs UP into shadow. Set into the far wall is a stone RELIQUARY, and " +
        "above it hangs a great brass BELL on a frayed rope. Doorways lead EAST to the " +
        "PARLOR and WEST to the DINING ROOM; the PORCH lies SOUTH.",
      searchDesc(ctx) {
        if (ctx.getFlag("bellRung")) {
          return "The BELL is spent. Fresh stone dust outlines the impossible SECRET DOOR in the NORTH wall, and the BONE " +
            "KEY's tooth-shaped profile matches its lock.";
        }
        if (ctx.getFlag("curseLiftable")) {
          return "Every filled recess in the RELIQUARY glows faintly. Its glass doors must be CLOSED to complete " +
            "the cabinet's seal; above it, the BELL rope trembles though the air is still.";
        }
        return `The RELIQUARY contains ${REQUIRED_FAMILY_ITEM_COUNT} heirloom-shaped recesses. The BELL rope hangs directly above them, ` +
          "waiting for a collection not yet complete.";
      },
      highDesc: "The shelves become transparent enough to reveal a hidden stair folding DOWN behind the brass LEVER.",
      extraDirections: (ctx) =>
        ctx.getFlag("floorDoorOpen") && ctx.getFlag("reliquarySealed")
          && !ctx.item("reliquary").open ? ["down"] : [],
      exits: {
        south: "porch", east: "parlor", west: "diningRoom", up: "landing",
        north: { to: "hollowPassage", via: "secretWingOpen",
          revealedBy: "bellRung",
          lockedMsg: "There's a seam in the north wall now, but it won't open on its own." },
      },
      on: {
        take(ctx, cmd) {
          const contents = nestedContents(ctx, "reliquary");
          const it = cmd.itemId
            ? contents.find((item) => item.id === cmd.itemId)
            : ctx.find(cmd.dobj, contents);
          if (!it) return null;
          if (!ctx.item("reliquary").open) return "The RELIQUARY'S glass doors are closed.";
          if (it.treasure && ctx.roomOf(it.id) === "reliquary") {
            return `The RELIQUARY grips the ${it.names[0]} in its stone recess. A family heirloom cannot be withdrawn.`;
          }
          if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
            return "Your hands are full. You'll have to drop something before retrieving it.";
          }
          ctx.moveItem(it.id, "inventory");
          return `The RELIQUARY releases the non-contributing ${it.names[0]}. Taken.`;
        },
        // Deposit heirlooms into the reliquary (scoring the deposit).
        put(ctx, cmd) {
          if (!cmd.iobj) return null;
          const dest = ctx.find(cmd.iobj);
          if (!dest || dest.id !== "reliquary") return null; // let generic put handle other containers
          if (!dest.open) return "The RELIQUARY'S glass doors are closed.";
          const it = ctx.find(cmd.dobj, ctx.inventory());
          if (!it) return "You aren't carrying that.";
          if (it.worn) return `Remove the ${it.names[0]} before putting it anywhere.`;
          if (it.id === "talisman" && ctx.roomOf("goldLocket") === "crypt") {
            return "The BM crest on the TALISMAN warms against your palm, but the RELIQUARY refuses it. This " +
              "heirloom still has work to do against the WRAITH; recover the GOLD LOCKET first.";
          }
          const alreadyLiftable = ctx.getFlag("curseLiftable");
          ctx.moveItem(it.id, "reliquary");
          if (it.treasure) {
            const scoreFlag = it.depositScoreFlag;
            if (!scoreFlag || !ctx.getFlag(scoreFlag)) {
              ctx.addScore(it.points || 0);
              if (scoreFlag) ctx.setFlag(scoreFlag);
            }
          }
          const status = reliquaryStatus(ctx);
          let msg = `You lay the ${it.names[0]} in the reliquary. It settles with a low, resonant hum.`;
          msg += `\n\nFamily heirlooms: ${status.contributing}/${status.required}.`;
          if (!it.treasure) {
            msg += ` The ${it.names[0]} does not contribute to that total.`;
          }
          if (status.nonContributing > 0) {
            msg += ` Non-contributing items currently inside: ${status.nonContributing}.`;
          }
          if (allTreasuresDeposited(ctx) && !alreadyLiftable) {
            ctx.setFlag("curseLiftable");
            msg += "\n\nAs the last family heirloom touches stone, every heirloom begins to glow. The air " +
              "grows thick and cold, and the great brass bell above the reliquary trembles as if " +
              "it longs to be RUNG. The RELIQUARY'S glass doors remain open; CLOSE them first.";
          }
          if (everythingDeposited(ctx) && !ctx.getFlag("floorDoorOpen")) {
            ctx.setFlag("floorDoorOpen");
            msg += "\n\nThen — with every family heirloom gathered — the faint RINGING " +
              "you've half-heard all night swells beneath your feet, and answers. With a grind of stone the " +
              "flagstones before the reliquary split and fold away, revealing a narrow STAIRCASE into the dark. " +
              "CLOSE RELIQUARY to seal the collection before the staircase becomes usable.";
          }
          return msg;
        },
        // The secret ending: with the floor stair open, descend to meet Gary.
        go(ctx, cmd) {
          if (cmd.dobj !== "down" || !ctx.getFlag("floorDoorOpen")) return null;
          if (ctx.item("reliquary").open || !ctx.getFlag("reliquarySealed")) {
            return "The hidden stair shudders beneath the open cabinet but refuses to admit you. CLOSE RELIQUARY first.";
          }
          ctx.state.room = "garysLair";
          return garyEnding(ctx);
        },
        ring(ctx, cmd) {
          const it = cmd.dobj ? ctx.find(cmd.dobj) : null;
          if (it && it.id !== "bell") return null;
          if (ctx.getFlag("bellRung")) {
            return "The bell's work is done. Something waits behind the new door to the north.";
          }
          if (ctx.item("reliquary").open || !ctx.getFlag("reliquarySealed")) {
            return "You tug the BELL rope, but the RELIQUARY'S doors have not been ritually latched and the bell " +
              "gives only a dull clunk. Explicitly CLOSE RELIQUARY before ringing it.";
          }
          if (!ctx.getFlag("curseLiftable")) {
            return "You seize the frayed rope and ring the great bell. Its toll rolls through the " +
              "empty house and dies away. Nothing answers — the heirlooms are not all gathered.";
          }
          ctx.setFlag("bellRung");
          ctx.moveItem("boneKey", "grandHall");
          ctx.moveItem("secretDoor", "grandHall");
          const points = awardProgress(ctx, "bellRung");
          return "You seize the rope and ring the great bell. Its toll swells until the walls shudder; " +
            "the gathered heirlooms blaze with light, the shadows shriek and recoil, and the curse of " +
            "Blackwood shatters like dropped glass.\n\n" +
            "But the house is not finished with you. Among the glowing heirlooms a slender BONE KEY rises, " +
            "turns once in the air, and clatters to the flagstones at your feet. Behind you, with a grinding " +
            "of hidden stone, a SECRET DOOR opens in the north wall of the hall — onto a passage that should not exist." +
            awardSuffix(points);
        },
      },
    },

    parlor: {
      name: "Parlor",
      art: ROOM_ART.parlor,
      desc:
        "A mouldering PARLOR of draped furniture. Above the cold fireplace hangs a huge, " +
        "grim PROFILE PAINTING of a bearded patriarch, whose eyes seem to track you. An archway " +
        "returns WEST to the ROYAL HALL; a low door leads SOUTH to the LIBRARY.",
      searchDesc(ctx) {
        return ctx.getFlag("safeRevealed")
          ? "Behind the swung-aside PROFILE PAINTING, the iron SAFE's combination dial shows recent fingerprints."
          : "The PROFILE PAINTING frame stands proud of the wall. One side has hinges; the other has fingerprints where a hand might push.";
      },
      highDesc: "The wall behind the PROFILE PAINTING shimmers around the hard rectangular outline of an IRON SAFE.",
      exits: { west: "grandHall", south: "library" },
      on: { code: enterSafeCode },
    },

    library: {
      name: "Library",
      art: ROOM_ART.library,
      desc:
        "Floor-to-ceiling shelves sag under rotting books. One shelf bears a curious brass " +
        "LEVER where a book should be. The PARLOR lies NORTH.",
      searchDesc(ctx) {
        return ctx.getFlag("leverPulled")
          ? "Scrape marks confirm the open bookcase is a counterweighted door. The concealed stair descends DOWN into darkness."
          : "The brass LEVER is polished by hands while every nearby book is thick with dust. It was meant to be pulled.";
      },
      exits: {
        north: "parlor",
        down: { to: "secretChamber", via: "leverPulled", revealedBy: "leverPulled",
          lockedMsg: "The shelves stand solid and shut." },
      },
    },

    secretChamber: {
      name: "Hidden Chamber",
      art: ROOM_ART.secretChamber,
      desc:
        "A cramped HIDDEN CHAMBER that has not seen daylight in a century. A single lectern " +
        "stands at its centre. The only way out is the stair UP to the LIBRARY.",
      searchDesc:
        "The lectern's silver clasp-marks fit the GRIMOIRE exactly. Nothing else here has survived except the warning chill.",
      dark: true,
      exits: { up: "library" },
    },

    diningRoom: {
      name: "Dining Room",
      art: ROOM_ART.diningRoom,
      desc:
        "A long banquet table lies buried under dust and fallen plaster. Upon it, " +
        "improbably, stands a tarnished silver CANDLESTICK, its candle unburnt. The ROYAL HALL " +
        "is EAST; a swinging door leads SOUTH to the KITCHEN.",
      searchDesc:
        "Everything is dust-choked except the CANDLESTICK's wick. It is dry and usable, but it will need the MANOR'S " +
        "single precious MATCH.",
      exits: { east: "grandHall", south: "kitchen" },
    },

    kitchen: {
      name: "Kitchen",
      art: ROOM_ART.kitchen,
      desc:
        "A cavernous scullery of cold ranges and rusted hooks. A coil of stout ROPE hangs " +
        "on one hook, and a box of MATCHES sits on the sill. A heavy CELLAR DOOR is set in " +
        "the floor. The DINING ROOM lies NORTH.",
      searchDesc:
        "The MATCHBOX contains exactly one MATCH. The ROPE remains sound, the CELLAR DOOR has a lift-ring, and the " +
        "sweating super BURRITO appears to violate several eras of food-safety law.",
      exits: {
        north: "diningRoom",
        down: { to: "wineCellar", via: "cellarOpen", lockedMsg: "The cellar door is shut." },
      },
    },

    wineCellar: {
      name: "Wine Cellar",
      art: ROOM_ART.wineCellar,
      desc:
        "Racks of burst and blackened bottles line the dripping WINE CELLAR. One survivor gleams: " +
        "a CRYSTAL DECANTER of something that still catches the light. Stone steps climb UP " +
        "to the KITCHEN; an arch leads SOUTH, deeper, into a cold that raises the hairs on your neck.",
      searchDesc:
        "The DECANTER is the only intact valuable. Frost rims the SOUTHERN arch in the shape of grasping fingers; " +
        "crossing it without the TALISMAN feels terminal.",
      dark: true,
      exits: { up: "kitchen", south: "crypt" },
      on: {
        go(ctx, cmd) {
          if (cmd.dobj !== "south") return null;
          const tal = ctx.item("talisman");
          const protectedNow = tal && tal.loc === "inventory" && tal.worn;
          if (!protectedNow) {
            return ctx.kill(
              "You step through the arch into the crypt. From the great sarcophagus a WRAITH " +
              "rises — a shriek of cold and hatred given shape. Before you can flee it sweeps " +
              "through you, and your heart simply stops."
            );
          }
          const points = awardProgress(ctx, "wraithPassed");
          ctx.state.room = "crypt";
          return ctx.describeRoom() + awardSuffix(points);
        },
      },
    },

    crypt: {
      name: "Crypt",
      art: ROOM_ART.crypt,
      desc:
        "A low CRYPT of Blackwood dead. The WRAITH that guards it cowers from the TALISMAN " +
        "at your breast, hissing in the corners. On the central sarcophagus lies a GOLD " +
        "LOCKET. The only way out is NORTH to the WINE CELLAR.",
      searchDesc:
        "The TALISMAN's warmth pushes the WRAITH back whenever you approach the sarcophagus. The GOLD LOCKET is now within reach.",
      dark: true,
      exits: { north: "wineCellar" },
    },

    landing: {
      name: "Upstairs Landing",
      art: ROOM_ART.landing,
      desc:
        "A long UPSTAIRS LANDING overlooks the ROYAL HALL below. Doors open WEST to the NURSERY, " +
        "EAST to the GRAND BEDROOM, NORTH to the HALL BEDROOM, and SOUTH to the STUDY. A frayed CORD dangles from a " +
        "trap-door in the ceiling. The stairs go DOWN.",
      searchDesc(ctx) {
        return ctx.getFlag("ladderDown")
          ? "The lowered ATTIC ladder groans under its own weight. Climbing it while heavily laden would be suicidal."
          : "The CORD is connected to the ceiling trap-door and has a clean, hand-width patch near its end. Pulling it should lower something.";
      },
      extraDirections: (ctx) => (canFly(ctx) || ctx.getFlag("ladderDown")) ? ["up"] : [],
      exits: { down: "grandHall", north: "hallBedroom", west: "nursery", east: "masterBedroom", south: "study" },
      on: {
        // The attic ladder is flimsy: climb it laden and it — and you — come down hard.
        // Any flight source (mushroom high or worn WINGED SHOES) bypasses the ladder
        // entirely, floating straight up through the shut trap-door.
        go(ctx, cmd) {
          if (cmd.dobj !== "up") return null;
          if (canFly(ctx)) {
            const byShoes = !((ctx.getFlag("high") || 0) > 0);
            ctx.state.room = "attic";
            return (byShoes
              ? "The WINGED SHOES lift you straight up through the trap-door and into the ATTIC, the rotten ladder irrelevant."
              : "You float through the closed trap-door as if wood were only a suggestion.")
              + "\n\n" + ctx.describeRoom();
          }
          if (!ctx.getFlag("ladderDown")) return "There is no way up; the trap-door is shut.";
          if (ctx.inventoryLoad() > 2) {
            return ctx.kill(
              "You climb the flimsy attic ladder, but weighed down as you are, the rotted rungs " +
              "give way — and then the attic floor itself. You fall through in a roar of splintered " +
              "wood and lie still among the wreckage."
            );
          }
          ctx.state.room = "attic";
          return ctx.describeRoom();
        },
      },
    },

    nursery: {
      name: "Nursery",
      art: ROOM_ART.nursery,
      desc:
        "A child's NURSERY, its WALLPAPER peeling in long tongues. A rocking horse stares " +
        "with one glass eye. On a shelf sits a JEWELED MUSIC BOX. The UPSTAIRS LANDING lies EAST.",
      searchDesc:
        "The MUSIC BOX lid has a tiny spring catch. Something metallic rattles inside when the box is tilted. " +
        "One curling tongue of WALLPAPER, low near the baseboard, looks looser than the rest.",
      highDesc: "The MUSIC BOX turns transparent. A TINY KEY gleams inside its closed lid.",
      exits: {
        east: "landing",
        // A crawl-gap into the space between the walls — the one deliberate,
        // repeatable way in, versus the mystery package/lightning bolt's luck.
        in: { to: "betweenWalls", via: "wallGapFound", revealedBy: "wallGapFound",
          lockedMsg: "The wallpaper is just wallpaper, near as you can tell." },
      },
      on: {
        go(ctx, cmd) {
          if (cmd.dobj !== "in" || !ctx.getFlag("wallGapFound")) return null;
          const points = discoverBetweenWalls(ctx);
          ctx.setFlag("seen:betweenWalls", true);
          ctx.state.room = "betweenWalls";
          return ctx.describeRoom() + awardSuffix(points);
        },
      },
    },

    masterBedroom: {
      name: "Grand Bedroom",
      art: ROOM_ART.masterBedroom,
      desc:
        "A great canopied bed rots beneath a collapsed tester in the GRAND BEDROOM. On the vanity stands a locked " +
        "JEWELRY BOX of dark walnut. The UPSTAIRS LANDING lies WEST.",
      searchDesc:
        "The JEWELRY BOX's keyhole is absurdly small. A normal door KEY could never fit it; a miniature KEY might.",
      highDesc: "The dark wood becomes glassy, revealing a BLACKWOOD BLOODSIGNET inside the locked JEWELRY BOX.",
      exits: { west: "landing" },
    },

    study: {
      name: "Study",
      art: ROOM_ART.study,
      desc:
        "A book-lined STUDY with a great oak DESK. A leather-bound DIARY lies open upon it, " +
        "as though its writer had just stepped away. The UPSTAIRS LANDING lies NORTH.",
      searchDesc:
        "The DIARY is open to a page dog-eared so aggressively it can only be important. Several numbers are underlined in ink.",
      exits: { north: "landing" },
    },

    hallBedroom: {
      name: "Hall Bedroom",
      art: [
        "  .--------------.",
        "  | BED    ( O ) |",
        "  |        [_]   |",
        "  '----DOOR------'",
      ].join("\n"),
      desc:
        "A narrow HALL BEDROOM lies NORTH of the UPSTAIRS LANDING. A neatly made BED faces a tarnished MIRROR. " +
        "Beside it stands a NIGHT TABLE with a small LAMP and a closed DRAWER.",
      searchDesc:
        "The BED is untouched, the MIRROR is clouded, and the NIGHT TABLE'S DRAWER has a cheap plastic handle.",
      exits: { south: "landing" },
    },

    attic: {
      name: "Attic",
      art: ROOM_ART.attic,
      desc:
        "A vast, raftered ATTIC, silver with moonlight through a broken skylight. Amid the " +
        "shrouded lumber leans a small ANCESTRAL PORTRAIT in a gilt frame. The ladder leads DOWN.",
      searchDesc:
        "The ANCESTRAL PORTRAIT is valuable and portable. The ladder flexes ominously even before you add the weight of a full inventory.",
      extraDirections: (ctx) => canFly(ctx) ? ["up"] : [],
      exits: {
        down: "landing",
        // The astral door in the north gable — hidden and impassable until the
        // mushroom trip's third eye has shown it to you (sets vaultFound).
        north: { to: "hiddenVault", via: "vaultFound", revealedBy: "vaultFound",
          lockedMsg: "The NORTH gable is blank plaster and close shadow. Your ordinary eyes find no seam." },
      },
      on: {
        go(ctx, cmd) {
          if (cmd.dobj !== "up") return null;
          if (!canFly(ctx))
            return "The broken skylight is far above you. You need MUSHROOM flight or something worn on your FEET.";
          ctx.state.room = "roof";
          return "You rise through the broken skylight and settle onto the ROOF.\n\n" + ctx.describeRoom();
        },
      },
    },

    roof: {
      name: "Manor Roof",
      aliases: ["roof"],
      art: [
        "       /\\       |^|",
        "  ____/  \\______| |",
        " /_______________\\|",
        "      ROOFLINE",
      ].join("\n"),
      desc:
        "Slate ridges roll across the MANOR ROOF beneath the open sky. The broken ATTIC skylight is DOWN; " +
        "a narrow ridge runs EAST to the BELFRY.",
      searchDesc:
        "Only someone able to fly could cross the missing slates safely. The BELFRY'S louvers stand open.",
      exits: { down: "attic", east: "belfry" },
    },

    belfry: {
      name: "Belfry",
      art: [
        "      ______",
        "     / BELL \\",
        "    |   ()   |",
        "    |___||___|",
      ].join("\n"),
      desc:
        "The BELFRY crouches above the roofline around a weather-blackened bell. The MANOR ROOF is WEST. " +
        "A narrow maintenance hatch descends DOWN into the ASTRAL CHAMBER.",
      searchDesc:
        "The hatch bypasses the sealed ATTIC gable entirely. Its iron ladder drops directly beside the OBSIDIAN EYE.",
      exits: { west: "roof", down: "hiddenVault" },
    },

    // --- The astral treasure vault, reached by altered sight, flight, or belfry --
    hiddenVault: {
      name: "Astral Chamber",
      aliases: ["astral chamber", "obsidian chamber"],
      art: [
        "  .==============.",
        "  |  .--------.  |",
        "  |  |  (())  |  |",
        "  |  '--------'  |",
        "  '=============='",
      ].join("\n"),
      desc:
        "A windowless ASTRAL CHAMBER the living were never meant to find, mortared behind the ATTIC'S NORTH " +
        "gable. On a low stone plinth rests a single OBSIDIAN EYE — a cold sphere of black glass that " +
        "seems to watch you back. The ATTIC lies SOUTH; a BELFRY ladder climbs UP.",
      searchDesc:
        "The OBSIDIAN EYE drinks whatever light your sight gives it. Lifting it feels less like taking and more like being chosen.",
      dark: true,
      exits: { south: "attic", up: "belfry" },
    },

    // --- The hidden wing, revealed only after the curse is lifted (bell rung) ---
    hollowPassage: {
      name: "Hollow Passage",
      art: ROOM_ART.hollowPassage,
      desc:
        "A narrow HOLLOW PASSAGE of pale stone the MANOR kept hidden all this time. It is oddly warm, " +
        "and lit by no lamp you can find — as if the walls themselves remember daylight. The ROYAL HALL " +
        "lies back to the SOUTH; the PASSAGE runs NORTH.",
      searchDesc:
        "No mechanism or side PASSAGE interrupts the pale stone. The warmth and faint light both strengthen toward the NORTH.",
      exits: { south: "grandHall", north: "hollowSanctum" },
    },
    hollowSanctum: {
      name: "The Hollow Sanctum",
      art: ROOM_ART.hollowSanctum,
      desc:
        "A round, domed HOLLOW SANCTUM at the MANOR'S secret heart, filled with a soft grey light. The pale " +
        "SPIRIT of a robed woman waits beside a pedestal, and upon the pedestal rests a SILVER MIRROR. " +
        "Beyond her, an archway opens NORTH onto a growing dawn.",
      searchDesc:
        "The SPIRIT guards nothing now. The SILVER MIRROR lifts freely from its pedestal, and the NORTHERN dawn feels like an ending.",
      extraDirections: ["north"],
      exits: { south: "hollowPassage" },
      on: {
        // Step into the dawn to truly finish. Keeping the mirror earns a bonus.
        go(ctx, cmd) {
          if (cmd.dobj !== "north" && cmd.dobj !== "out") return null;
          const bonus = ctx.has("silverMirror") ? 30 : 0;
          if (bonus) ctx.addScore(STANDALONE_MAX_AWARDS.silverMirror);
          const fireSurvival = surviveSelfFire(ctx);
          return ctx.win(
            "You step through the archway into the first clean dawn Blackwood Manor has seen in a hundred " +
            "years. Behind you the spirit lifts her head, smiles — truly smiles — and fades, at peace at last." +
            (bonus
              ? "\n\nThe silver mirror is yours: an optional trophy proving you saw this through to the very end. (+30)"
              : "\n\n(You left the silver mirror on its pedestal — and its optional 30 points with it.)") +
            fireSurvival
          );
        },
      },
    },

    // --- The secret basement: the TRUE cliffhanger ending (see garyEnding) ---
    // Reached only on foot, via the floor stair that opens in the ROYAL HALL
    // once every required heirloom is in the reliquary. Entering triggers the ending outright,
    // so this room is essentially never explored interactively — it exists so
    // the destination is valid (and as the seed of BLACKWOOD MANOR II).
    garysLair: {
      name: "Gary's Call-Cave",
      art: GARY_LAIR_ART,
      desc:
        "A cramped, foul basement office beneath the ROYAL HALL: a battered desk, a green ROTARY PHONE, " +
        "cold burrito wrappers, a jar of MUSHROOMS, and a humming mini-FRIDGE. The stair climbs back UP.",
      searchDesc: "Whoever worked down here left in a violent hurry — and took your heirlooms with them.",
      exits: { up: "grandHall" },
    },

    // --- The hidden space reached through the nursery wall or random teleport ---
    betweenWalls: {
      name: "The Space Between the Walls",
      art: ROOM_ART.betweenWalls,
      desc:
        "You are somewhere the blueprints of BLACKWOOD MANOR insist does not exist: a dust-soft crawl-gap " +
        "between two walls, lit by no source you can name. Old newspaper insulation bulges from the studs, " +
        "and a tarnished BACKWARDS WATCH ticks, counter-clockwise, from a bent nail. There is no proper door here — " +
        "only the cramped gap OUT.",
      searchDesc:
        "Whoever built this space built it to be forgotten. The BACKWARDS WATCH is the only thing in it that " +
        "isn't dust.",
      exits: { out: "grandHall" },
    },
  },

  items: {
    // --- reliquary & bell (royal hall) ---
    reliquary: {
      names: ["reliquary", "cabinet"], adjectives: ["glass", "glass-fronted", "heirloom"],
      loc: "grandHall", fixed: true, container: true, capacity: 20,
      openable: true, open: false, autoOpenOnAccess: true, locksTreasures: true,
      desc: `A tall, glass-fronted RELIQUARY cabinet set into the stone wall. Its shelves hold ` +
        `${REQUIRED_FAMILY_ITEM_COUNT} heirloom-shaped recesses behind a pair of carved doors.`,
      on: {
        open(ctx) {
          const reliquary = ctx.item("reliquary");
          if (reliquary.open) return "The RELIQUARY'S glass doors are already open.";
          reliquary.open = true;
          ctx.setFlag("reliquarySealed", false);
          return "You open the RELIQUARY'S glass doors.";
        },
        close(ctx) {
          const reliquary = ctx.item("reliquary");
          reliquary.open = false;
          ctx.setFlag("reliquarySealed", true);
          const points = ctx.getFlag("curseLiftable")
            ? awardProgress(ctx, "reliquarySealed")
            : 0;
          return "You close the RELIQUARY'S glass doors and press until the ritual latch clicks." +
            (ctx.getFlag("floorDoorOpen")
              ? " The hidden staircase locks into place; the route DOWN is now open."
              : "") +
            awardSuffix(points);
        },
      },
    },
    bell: {
      names: ["bell", "rope"], adjectives: ["brass", "great"], loc: "grandHall", fixed: true, scenery: true,
      desc: "A great brass bell hung above the RELIQUARY, a frayed pull-rope trailing from it.",
      searchActions: ["ring"],
    },

    // --- a gift that very much does not want to be opened ---
    mysteryPackage: {
      names: ["package", "box", "parcel", "gift"], adjectives: ["mystery", "nice", "wrapped", "ribboned"],
      loc: "grandHall", takeable: true, readable: true,
      roomDesc: "A suspiciously nice, ribbon-tied PACKAGE sits on the floor, propped against the wall.",
      desc: "A beautifully wrapped package, ribbon and all, entirely out of place in this cobwebbed ruin. A " +
        "small card is tucked under the bow. It reads:\n\n" +
        "\"DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
      text:
        "\"DO NOT OPEN ME. NOPE NOPE NOPE. You are going to regert it! That's right — regert, not regret.\"",
      on: { open: openMysteryPackage },
    },

    // --- a bolt of lightning that speared into the floor and is, somehow, still here ---
    lightningBolt: {
      names: ["bolt", "lightning"], adjectives: ["lightning", "crackling", "jagged"],
      loc: null, fixed: true,
      roomDesc: "A jagged bolt of LIGHTNING is speared into the floor here, hissing and crackling, scorch " +
        "marks spreading outward.",
      desc: "Still crackling, blue-white and hair-raising, driven into the floorboards like it's daring you " +
        "to get closer.",
      on: { touch: touchLightningBolt },
    },

    // --- getting inside ---
    statue: {
      names: ["statue", "woman"], adjectives: ["stone", "robed"], loc: "garden", fixed: true, scenery: true,
      desc: "A robed stone woman, features worn smooth. She leans oddly, as if something props her up.",
      on: { move: revealKey, push: revealKey, pull: revealKey, examine: revealKey },
    },
    well: {
      names: ["well", "shaft"], loc: "garden", fixed: true, scenery: true,
      desc: "A round stone well, its bucket and windlass long gone. The shaft drops into " +
        "pure black — a long way DOWN. Without a ROPE to climb back out, going DOWN there " +
        "would be the last thing you ever did.",
      on: { enter: descendWell, climb: descendWell },
    },
    frontKey: {
      names: ["key"], adjectives: ["iron", "front", "door", "heavy"], loc: null, takeable: true,
      progressPoints: 5, progressFlag: "progressItem:frontKey",
      consumedOnUnlock: "The old iron key snaps off inside the lock and is spent.",
      desc: "A heavy iron door-key, cold and gritty with earth. Age has left a deep crack along its shaft.",
    },
    mailbox: {
      names: ["mailbox"], adjectives: ["brass"], loc: "porch", fixed: true, container: true,
      openable: true, open: false, capacity: 2,
      desc: "A dented brass mailbox bolted to the PORCH rail.",
    },
    letter: {
      names: ["letter"], loc: "mailbox", takeable: true, readable: true,
      desc: "A single sheet of good paper, water-stained.",
      text:
        "The letter reads: \"To whoever inherits this cursed MANOR — the family's heirlooms must be returned " +
        "to the RELIQUARY in the ROYAL HALL, all of them, its doors CLOSED, and the BELL rung, or the curse will never lift. " +
        "Do not linger in the dark. And God help you in the CRYPT.\"",
      on: { burn: burnLetter },
    },

    // --- the ceremonial brazier + its reward (garden) ---
    brazier: {
      names: ["brazier", "firebowl", "bowl"], adjectives: ["iron", "cold", "ceremonial", "old"],
      loc: "garden", fixed: true,
      roomDesc: "A cold iron BRAZIER stands on a tripod amid the weeds, heaped with damp moss.",
      desc: "A cold iron brazier on a rusted tripod, heaped with grave-damp moss and packed black kindling. " +
        "Old scorch-marks ring its base. A lone match won't touch moss this wet, but a sustained candle flame " +
        "worked around the whole bowl might.",
      on: { light: lightBrazier, burn: lightBrazier },
    },
    emberStone: {
      names: ["emerald gem", "gem", "emerald", "stone"], adjectives: ["emerald", "green", "glassy"],
      loc: null, takeable: true,
      desc: "A deep-green EMERALD GEM, warm from the brazier and faceted so precisely that even weak sunlight " +
        "passes through it in a narrow green beam.",
      on: { take: takeOakGem },
    },
    oakMechanism: {
      names: ["panel", "mechanism", "slots", "slot"], adjectives: ["oak", "iron", "inset"],
      loc: "greatOak", fixed: true, scenery: true, container: true, open: true, capacity: 3,
      desc: "A dark iron PANEL inset in the GREAT OAK, fitted with three vertically stacked slots beneath " +
        "a web of small mirrors and sun shafts.",
      on: { examine: describeOakPanel, search: describeOakPanel, put: putOakGem },
    },
    greenGlassStone: {
      names: ["ruby gem", "gem", "ruby", "stone"], adjectives: ["ruby", "red", "glassy"],
      loc: "oakMechanism", takeable: true,
      desc: "A translucent RUBY GEM cut into a deep red prism that fits one of the GREAT OAK'S three slots.",
      on: { take: takeOakGem },
    },
    blueGlassStone: {
      names: ["sapphire gem", "gem", "sapphire", "stone"], adjectives: ["sapphire", "blue", "glassy"],
      loc: "oakMechanism", takeable: true,
      desc: "A translucent SAPPHIRE GEM cut into a deep blue prism that fits one of the GREAT OAK'S three slots.",
      on: { take: takeOakGem },
    },
    oakPlatform: {
      names: ["platform", "lift"], adjectives: ["wooden", "oak", "pulley"],
      loc: null, fixed: true, scenery: true,
      desc: "A broad wooden PLATFORM hanging from old but sturdy ropes. It shuttles between the roots and the TREE FORT.",
      on: { enter: enterOakPlatform, climb: enterOakPlatform },
    },
    signalFlags: {
      names: ["flags", "flag", "signals"], adjectives: ["signal", "faded"],
      loc: "treeFort", fixed: true, scenery: true,
      desc: "A string of faded SIGNAL FLAGS spells something that was probably hilarious to children a century ago.",
    },
    blanketHideout: {
      names: ["hideout", "blanket", "fort"], adjectives: ["blanket", "secret"],
      loc: "treeFort", fixed: true, scenery: true,
      desc: "A blanket HIDEOUT occupies one corner, furnished with a cracked compass, three acorn cups, and a sign: NO ADULTS.",
    },
    woodenSlingshot: {
      names: ["slingshot", "catapult"], adjectives: ["wooden", "forked"],
      loc: "treeFort", fixed: true, scenery: true,
      desc: "A forked wooden SLINGSHOT has been nailed to the wall after what appears to have been one incident too many.",
    },
    spyglassCradle: {
      names: ["cradle", "mount", "swivel"], adjectives: ["rusted", "spyglass"],
      loc: "treeFort", fixed: true, scenery: true,
      desc: "The iron swivel CRADLE is rusted solid, aimed permanently at the manor's BELFRY.",
    },
    spyglass: {
      names: ["spyglass", "telescope"], adjectives: ["brass", "blackwood", "bm"],
      loc: "treeFort", takeable: true, treasure: true, points: 8,
      roomDesc: "A brass SPYGLASS marked BM sits in a rusted swivel cradle aimed at the distant BELFRY.",
      desc: "A handsome brass SPYGLASS. The initials BM are etched into its barrel, identifying it as a Blackwood heirloom.",
      on: { examine: inspectSpyglass, search: inspectSpyglass, take: takeSpyglass },
    },

    // --- kitchen edibles: high / sick / help ---
    mushrooms: {
      names: ["mushrooms", "mushroom", "fungus"], adjectives: ["dried", "shriveled", "purple"],
      loc: "kitchen", takeable: true, edible: true, highTurns: 12,
      roomDesc: "A dried cluster of shriveled purple MUSHROOMS rests on the windowsill.",
      desc: "Dried purple mushrooms, faintly luminous and just as potent as a fresh cluster.",
      on: { eat: eatMushrooms },
    },
    outhouseMushrooms: {
      names: ["mushrooms", "mushroom", "fungus"],
      adjectives: ["fresh", "shit-fueled", "purple", "toilet"],
      loc: null, takeable: true, edible: true, fresh: true, highTurns: 12,
      roomDesc: "Inside the TOILET HOLE, fresh MUSHROOMS glisten with unmistakable shit and piss.",
      desc: "Fresh, shit-fueled purple mushrooms from inside the TOILET HOLE. They are visibly wet with literal waste.",
      on: { take: takeToiletMushrooms, eat: eatMushrooms },
    },
    burrito: {
      names: ["burrito", "wrap"], adjectives: ["aged", "super", "spicy", "death-wish", "questionable"],
      loc: "kitchen", takeable: true, edible: true,
      roomDesc: "A foil-wrapped GARY'S MEGA ASS BLOW TAQUERIA DEATH WISH SPICY BURRITO sweats on the table.",
      desc: "Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito is an aged, foil-wrapped monument to bad " +
        "judgment. A forensic cross-section reveals two kinds of beans, three kinds of cheese, four kinds of meat, " +
        "and highly questionable lettuce that looks capable of carrying Cyclospora cayetanensis. Against all " +
        "available evidence, it may be edible if you're feeling adventurous.",
      on: {
        eat: eatBurrito,
      },
    },
    obsidianEye: {
      names: ["obsidian eye", "eye", "sphere", "orb"], adjectives: ["obsidian", "black", "cold", "glass", "scrying"],
      loc: "hiddenVault", takeable: true, wearable: true, worn: false,
      wearSlot: "forehead", grantsHiddenSight: true,
      roomDesc: "A cold OBSIDIAN EYE rests on the plinth, watching.",
      desc: "A sphere of black volcanic glass, cold as the CRYPT and faintly, wrongly aware. Its underside is " +
        "unnaturally adhesive: WEAR it on your FOREHEAD as a third eye to expose things the MANOR keeps hidden. " +
        "It does not produce light.",
      on: { take: takeObsidianEye },
    },
    burritoWrapper: {
      names: ["wrapper", "foil", "tinfoil"], adjectives: ["burrito", "crumpled", "used", "tin"],
      loc: null, takeable: true,
      roomDesc: "The crumpled BURRITO WRAPPER and its greasy tin foil lie here.",
      desc: "The used burrito wrapper is laminated with a stubborn sheet of tin foil. It smells dangerous, but " +
        "its shiny inner surface looks capable of redirecting a brief digestive flame.",
    },
    milk: {
      names: ["milk", "bottle"], adjectives: ["cold", "fresh", "glass"],
      loc: "kitchen", takeable: true, drinkable: true,
      roomDesc: "A cold BOTTLE OF MILK sits untouched in the pantry nook.",
      desc: "A sealed glass bottle of fresh milk, impossibly cold and apparently safe to drink.",
      on: { drink: drinkMilk },
    },
    apple: {
      names: ["apple"], adjectives: ["red", "crisp", "kitchen"],
      loc: "kitchen", takeable: true, edible: true,
      roomDesc: "A single crisp red APPLE sits in a shallow pantry basket.",
      desc: "A flawless red apple. In this KITCHEN, its lack of mould is almost supernatural.",
    },
    toilet: {
      names: ["toilet", "hole", "latrine", "loo"], adjectives: ["outhouse", "dark", "earthen"],
      loc: "privy", fixed: true, container: true, open: true, capacity: 8,
      roomDesc: "A rough TOILET HOLE gapes beneath the wooden seat. A faint purple glimmer leaks from below the rim.",
      desc: "A wooden seat over a raw hole in the earth. Something faintly purple glimmers below. It has no plumbing.",
      on: {
        sit: useToilet, use: useToilet, enter: useToilet, flush: flushToilet,
        examine: inspectToilet,
      },
    },
    dreadmaw: {
      names: ["dragon", "dreadmaw", "wyrm"], adjectives: ["sleeping", "female", "vast", "ashen"],
      loc: "dragonCaveMouth", fixed: true, scenery: true,
      desc: "DREADMAW THE DRAGON: an ancient female dragon armoured in plates like burnt cathedral stone. " +
        "She is sleeping directly across the CAVE entrance.",
      on: {
        talk: talkToDragon, wake: wakeDragon, give: giveDragon, put: giveDragon,
        say: sayNearDragon,
        move: dragonFire, push: dragonFire, pull: dragonFire, touch: dragonFire,
        attack: dragonFire, climb: dragonFire,
      },
    },
    goldDoubloon: {
      names: ["doubloon", "coin"], adjectives: ["gold", "dragon", "dreadmaw"],
      loc: null, takeable: true,
      desc: "A heavy GOLD DOUBLOON stamped with DREADMAW's horned profile and a sun being swallowed. " +
        "Around its edge, one word has been etched by hand: LORE.",
    },
    dragonVaultDoor: {
      names: ["door", "vault"], adjectives: ["inner", "black", "sealed", "vault"],
      loc: "trollGate", fixed: true, scenery: true,
      desc: "A seamless black VAULT DOOR with no keyhole. One rune resembles a listening ear.",
      on: { say: answerTrollRiddle },
    },
    caveTroll: {
      names: ["troll", "guard"], adjectives: ["cave", "warty", "broad", "male"],
      loc: "trollGate", fixed: true, scenery: true,
      desc: "A broad male TROLL with granite-coloured warts sits before the VAULT DOOR. He looks more literary than hungry.",
      on: { talk: talkToTroll, wake: talkToTroll },
    },
    dragonHoard: {
      names: ["hoard", "riches", "gold", "treasure"], adjectives: ["dragon", "vast", "dreadmaw"],
      loc: "dreadmawVault", fixed: true, scenery: true,
      desc: "A mountainous dragon hoard filling DREADMAW'S VAULT: gold, gems, crowns, and several objects too cursed-looking to price.",
    },
    familyRing: {
      names: ["ring", "signet"], adjectives: ["dusty", "family", "blackwood", "bm"],
      loc: "dragonAntechamber", takeable: true, treasure: true, points: 20,
      wearable: true, worn: false, wearSlot: "finger",
      roomDesc: "A DUSTY FAMILY RING marked BM glints through the grit of an ore cart.",
      desc: "A heavy BLACKWOOD FAMILY RING filmed with mine dust. The raised initials BM remain sharp beneath the grime.",
    },
    backpack: {
      names: ["backpack", "pack", "rucksack"], adjectives: ["sturdy", "canvas", "mining"],
      loc: "deepShaft", takeable: true, wearable: true, worn: false,
      wearSlot: "back", autoWearOnTake: true, carryCapacity: 20,
      roomDesc: "A sturdy canvas BACKPACK hangs from an abandoned ore cart.",
      desc: "A sturdy mining BACKPACK with enough pockets and straps to raise your carrying capacity to twenty items.",
    },
    headlamp: {
      names: ["headlamp", "lamp"], adjectives: ["mining", "battery", "battered"],
      loc: "mineGallery", takeable: true, wearable: true, wearSlot: "head",
      lightSource: true, selfPowered: true, activatesOnWear: true, lit: false, fuel: 200,
      lowFuelMsg: "The HEADLAMP dims. Its battery has only a few turns left.",
      outOfFuelMsg: "The HEADLAMP flickers once and its battery dies.",
      roomDesc: "A battered mining HEADLAMP hangs from a timber support.",
      desc: "A battery-powered mining HEADLAMP with a cracked elastic strap. Its sealed lamp still promises two hundred turns of light.",
    },
    familyCrest: {
      names: ["crest", "emblem", "arms"], adjectives: ["family", "blackwood", "silver"],
      loc: "dreadmawVault", takeable: true, treasure: true, points: 15,
      roomDesc: "The BLACKWOOD FAMILY CREST rests on a velvet cushion beside the hoard.",
      desc: "The BLACKWOOD FAMILY CREST, cast in blackened silver: a raven above crossed keys. One of the " +
        `${REQUIRED_FAMILY_ITEM_COUNT} heirlooms required by the RELIQUARY.`,
    },
    wingedShoes: {
      names: ["shoes", "sandals"], adjectives: ["winged", "gold", "golden"],
      loc: "dreadmawVault", takeable: true, wearable: true, wearSlot: "feet", grantsFlight: true,
      roomDesc: "A pair of golden WINGED SHOES rests atop a heap of coins.",
      desc: "Golden WINGED SHOES with living white feathers at each ankle. Worn on the FEET, they grant true flight.",
      wearMsg: "You lace the WINGED SHOES onto your feet. The little feathers snap taut, beat once — and your heels rise off the floor.",
      wearArt: MAP_MARK + WINGED_SHOES_ART + MAP_MARK,
    },
    hallBed: {
      names: ["bed"], adjectives: ["hall", "narrow", "made"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A narrow BED made with yellowed but carefully tucked linen.",
    },
    hallMirror: {
      names: ["mirror"], adjectives: ["hall", "bedroom", "tarnished"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A tarnished MIRROR that makes every reflection look slightly farther away than it should.",
    },
    nightTable: {
      names: ["table", "nightstand"], adjectives: ["night", "bedside", "small"],
      loc: "hallBedroom", fixed: true, scenery: true,
      desc: "A small NIGHT TABLE holding a LAMP and a shallow DRAWER.",
    },
    nightDrawer: {
      names: ["drawer"], adjectives: ["night", "table", "bedside"],
      loc: "hallBedroom", fixed: true, scenery: true,
      container: true, openable: true, open: false, capacity: 3,
      desc: "A cheap wooden DRAWER in the NIGHT TABLE.",
    },
    bedsideLamp: {
      names: ["lamp"], adjectives: ["night", "bedside", "table"],
      loc: "hallBedroom", fixed: true, scenery: true,
      lightSource: true, selfPowered: true, lit: false,
      desc: "A small electric LAMP with a cloth shade and a working pull-chain.",
    },
    xrayGoggles: {
      names: ["goggles", "glasses"], adjectives: ["xray", "x-ray", "plastic", "cheap"],
      loc: "nightDrawer", takeable: true, wearable: true, wearSlot: "eyes",
      grantsMushroomVision: true, grantsDarkVision: true,
      desc: "Cheap plastic XRAY GOGGLES with red lenses and lightning bolts on the arms. Somehow, they actually work.",
    },
    frontDoor: {
      names: ["door", "house", "manor", "mansion"], adjectives: ["front", "oak", "great"],
      loc: "porch", fixed: true, scenery: true, enterTo: "north",
      openable: true, open: false, locked: true, keyId: "frontKey",
      desc: "A great oak door, black with age, with a heavy iron lock.",
      on: {
        open(ctx) {
          const d = ctx.item("frontDoor");
          if (d.locked) return "The front door is locked.";
          if (d.open) return "The front door already stands open.";
          d.open = true;
          ctx.setFlag("frontDoorOpen");
          const points = awardProgress(ctx, "frontDoorOpened");
          return "The great door swings inward with a groan, onto a darkness that smells of dust and old smoke." +
            awardSuffix(points);
        },
      },
    },

    // --- light ---
    candlestick: {
      names: ["candlestick", "candle"], adjectives: ["silver", "tarnished"], loc: "diningRoom",
      takeable: true, treasure: true, points: 10, lightSource: true, lit: false, fuel: 120,
      desc: "A tarnished silver candlestick, heavy and fine, its candle miraculously unburnt.",
      on: {
        light(ctx) {
          const c = ctx.item("candlestick");
          if (c.lit) return "It is already lit.";
          if (c.fuel <= 0) return "The candle is a spent stub; it will not catch.";
          const match = carriedMatch(ctx);
          if (!match) return "You have nothing to light it with.";
          c.lit = true;
          ctx.destroy(match.id);
          return "You strike a match and touch it to the wick. The candle flares to life, throwing " +
            "long shadows — and the spent match crumbles to ash. (You have no more matches.)";
        },
      },
    },
    matches: {
      names: ["matches", "match"], adjectives: ["box"], loc: "kitchen", takeable: true,
      desc: "A box holding a single dry match. Just one.",
    },
    rope: {
      names: ["rope", "coil"], adjectives: ["stout"], loc: "kitchen", takeable: true,
      desc: "A coil of stout rope, still sound.",
    },
    cellarDoor: {
      names: ["cellar", "trapdoor", "door"], adjectives: ["heavy", "cellar"],
      loc: "kitchen", fixed: true, scenery: true, enterTo: "down", openable: true, open: false,
      desc: "A heavy trap-door set flush in the KITCHEN floor, iron-ringed.",
      on: {
        open(ctx) {
          if (ctx.getFlag("cellarOpen")) return "The cellar door already gapes open.";
          ctx.item("cellarDoor").open = true;
          ctx.setFlag("cellarOpen");
          const points = awardProgress(ctx, "cellarOpened");
          return "You haul the heavy cellar door up on its hinges. Cold, wet air breathes up from stone steps descending into black." +
            awardSuffix(points);
        },
      },
    },

    // --- library / secret chamber ---
    lever: {
      names: ["lever"], adjectives: ["brass"], loc: "library", fixed: true, scenery: true,
      desc: "A brass lever set into the shelving where a book should be.",
      on: {
        pull(ctx) {
          if (ctx.getFlag("leverPulled")) return "The bookcase already stands open.";
          ctx.setFlag("leverPulled");
          const points = awardProgress(ctx, "libraryPassageOpened");
          return "You haul on the lever. With a grinding of counterweights a whole section of " +
            "bookcase swings aside, baring a stair that spirals down into darkness." + awardSuffix(points);
        },
      },
    },
    grimoire: {
      names: ["grimoire", "book"], adjectives: ["first-edition", "forbidden", "black"], loc: "secretChamber",
      takeable: true, treasure: true, points: 15, readable: true,
      desc: "A heavy black grimoire, clasped in tarnished silver — a priceless first edition.",
      text: "The grimoire is written in a hand that hurts to follow. You snap it shut. Some things are worth money, not reading.",
    },

    // --- parlor safe (behind the profile painting) ---
    portrait: {
      names: ["painting", "profile", "portrait"], adjectives: ["grim", "patriarch", "huge"], loc: "parlor",
      fixed: true, scenery: true,
      desc: "A grim PROFILE PAINTING of the patriarch. The frame stands slightly proud of the wall, as if hinged.",
      on: { move: revealSafe, push: revealSafe, examine: revealSafe },
    },
    safe: {
      names: ["safe"], adjectives: ["iron"], loc: null, fixed: true, container: true, openable: true,
      open: false, locked: true, capacity: 3,
      desc: "A squat iron safe set into the wall, fitted with a combination dial.",
      on: {
        open: openSafe,
      },
    },
    talisman: {
      names: ["talisman", "amulet"], adjectives: ["silver", "protective"], loc: "safe", takeable: true,
      wearable: true, worn: false, wearSlot: "neck", treasure: true, points: 15,
      desc: "A silver talisman on a chain, warm to the touch and graven with wards against the dead. The back " +
        "bears the BM crest, identifying the protective charm as a Blackwood family heirloom.",
    },

    // --- study diary ---
    desk: {
      names: ["desk"], adjectives: ["oak"], loc: "study", fixed: true, scenery: true,
      desc: "A great oak desk, its drawers swollen shut.",
    },
    diary: {
      names: ["diary", "journal"], adjectives: ["leather", "leather-bound"], loc: "study", takeable: true,
      readable: true,
      desc: "A leather-bound diary in a spidery hand.",
      on: {
        read(ctx) {
          const points = awardProgress(ctx, "diaryDecoded");
          ctx.setFlag("knowsCombo");
          return "The last entry reads:\n" +
            "  \"I have hidden the TALISMAN in the wall-safe behind my own PROFILE PAINTING in the PARLOR.\n" +
            "   The combination, lest I forget in my terror: 7 left, 3 right, 9 left. If the wraith\n" +
            "   takes me, whoever comes after must WEAR the TALISMAN before they dare the CRYPT.\"" +
            awardSuffix(points);
        },
      },
    },

    // --- nursery wallpaper -> crawl-gap into the space between the walls ---
    wallpaper: {
      names: ["wallpaper", "wall", "lath"], adjectives: ["peeling", "loose", "curling"],
      loc: "nursery", fixed: true, scenery: true,
      desc: "Long tongues of wallpaper hang loose from the plaster. Low near the baseboard, one strip has " +
        "pulled almost all the way free, and the lath behind it sounds hollow when you rap on it.",
      on: { pull: revealWallGap, push: revealWallGap, search: revealWallGap },
    },

    // --- nursery music box -> tiny key ---
    musicBox: {
      names: ["music box", "musicbox", "box"], adjectives: ["jeweled", "jewelled", "music"], loc: "nursery",
      takeable: true, treasure: true, points: 15, container: true, openable: true, open: false, capacity: 1,
      desc: "A jeweled music box, its lid inlaid with mother-of-pearl.",
      on: {
        open(ctx) {
          const box = ctx.item("musicBox");
          if (box.open) return "The music box is already open.";
          box.open = true;
          const points = awardProgress(ctx, "musicBoxOpened");
          return "You release the tiny spring catch and open the MUSIC BOX, revealing a TINY KEY." +
            awardSuffix(points);
        },
      },
    },
    tinyKey: {
      names: ["key"], adjectives: ["tiny", "small", "brass"], loc: "musicBox", takeable: true,
      progressPoints: 5, progressFlag: "progressItem:tinyKey",
      consumedOnUnlock: "The tiny key disappears into the jewelry box's spring mechanism.",
      desc: "A tiny brass key, no longer than your thumbnail, made for a single delicate mechanism.",
    },

    // --- grand bedroom jewelry box -> Blackwood Bloodsignet ---
    jewelryBox: {
      names: ["jewelry box", "jewellery box", "jewelry", "box", "casket"], adjectives: ["walnut", "dark"],
      loc: "masterBedroom", fixed: true, container: true, openable: true, open: false, locked: true,
      keyId: "tinyKey", capacity: 2,
      desc: "A dark walnut jewelry box with a tiny keyhole.",
      on: {
        open(ctx) {
          const box = ctx.item("jewelryBox");
          if (box.locked) return "The jewelry box is locked.";
          if (box.open) return "The jewelry box is already open.";
          box.open = true;
          const points = awardProgress(ctx, "jewelryBoxOpened");
          return "You open the JEWELRY BOX, revealing a BLACKWOOD BLOODSIGNET." + awardSuffix(points);
        },
      },
    },
    rubyRing: {
      names: ["bloodsignet", "signet", "ring"],
      adjectives: ["ruby", "red", "blackwood", "blood"], loc: "jewelryBox", takeable: true,
      treasure: true, points: 20, wearable: true, worn: false, wearSlot: "finger",
      desc: "The BLACKWOOD BLOODSIGNET: a heavy gold ring set with a ruby like a suspended drop of blood. " +
        "The initials BM are embossed inside the band, marking it as a Blackwood family heirloom.",
    },

    // --- crypt ---
    wraith: {
      names: ["wraith", "ghost", "spirit"], loc: "crypt", fixed: true, scenery: true,
      desc: "A shroud of cold hatred, kept at bay by the TALISMAN. It hisses from the corners.",
    },
    goldLocket: {
      names: ["locket"], adjectives: ["gold"], loc: "crypt", takeable: true, treasure: true, points: 20,
      desc: "A gold locket, cold as the grave, its clasp shaped like clasped hands.",
    },

    // --- landing cord (attic ladder) ---
    cord: {
      names: ["cord"], adjectives: ["frayed"], loc: "landing", fixed: true, scenery: true,
      desc: "A frayed cord dangling from the ATTIC trap-door in the ceiling.",
      on: {
        pull(ctx) {
          if (ctx.getFlag("ladderDown")) return "The ladder is already down.";
          ctx.setFlag("ladderDown");
          return "You pull the cord. A trap-door drops open and a rickety wooden ladder clatters down from the attic.";
        },
      },
    },

    // --- other treasures ---
    ancientCoin: {
      names: ["coin"], adjectives: ["ancient", "old"], loc: null, takeable: true, treasure: true, points: 10,
      desc: "An ancient coin, worn smooth, stamped with a face no one remembers.",
    },
    crystalDecanter: {
      names: ["decanter"], adjectives: ["crystal"], loc: "wineCellar", takeable: true, treasure: true, points: 15,
      desc: "A cut-crystal decanter, still full, throwing splinters of colour even in the gloom.",
    },
    ancestralPortrait: {
      names: ["portrait", "miniature"], adjectives: ["ancestral", "small", "gilt"], loc: "attic",
      takeable: true, treasure: true, points: 20, scenery: true,
      desc: "A small ANCESTRAL PORTRAIT painted in miniature and set in a gilt frame — a woman who looks " +
        "unsettlingly like the STATUE in the GARDEN.",
    },

    // --- Post-game (appear only after the bell is rung) ---
    boneKey: {
      names: ["key"], adjectives: ["bone", "pale", "slender"], loc: null, takeable: true,
      progressPoints: 5, progressFlag: "progressItem:boneKey",
      consumedOnUnlock: "The BONE KEY crumbles into pale dust inside the lock.",
      desc: "A slender key carved from old bone, still faintly warm to the touch. It looks too brittle to turn twice.",
    },
    secretDoor: {
      names: ["door", "seam"], adjectives: ["secret", "hidden", "north"], loc: null, fixed: true, scenery: true,
      openable: true, open: false, locked: true, keyId: "boneKey", enterTo: "north",
      desc: "A door of black wood where no door was, fitted with a keyhole shaped like a tooth.",
      on: {
        open(ctx) {
          const d = ctx.item("secretDoor");
          if (d.locked) return "The secret door won't budge — it wants that bone key.";
          if (d.open) return "It already stands open.";
          d.open = true;
          ctx.setFlag("secretWingOpen");
          const points = awardProgress(ctx, "secretDoorOpened");
          return "The secret door swings inward on silent hinges, breathing out cold, clean air." +
            awardSuffix(points);
        },
      },
    },
    spirit: {
      names: ["spirit", "matriarch", "woman", "ghost"], adjectives: ["pale", "grey", "robed"],
      loc: "hollowSanctum", fixed: true, scenery: true,
      desc: "The pale spirit of a robed woman — the face from the GARDEN STATUE and the little portrait. " +
        "She was weeping, but her eyes are kind now.",
      on: {
        pray: () => "She bows her head. \"You lifted what my own blood could not. Take the mirror, and go and live — since I no longer can.\"",
        give: () => "She shakes her head gently. \"I need nothing now but rest, and you have given me that.\"",
        attack: () => "You couldn't — and wouldn't. She means you no harm.",
      },
    },
    silverMirror: {
      names: ["mirror"], adjectives: ["silver"], loc: "hollowSanctum", takeable: true,
      desc: "An age-clouded silver hand-mirror. In it, for just a moment, you see BLACKWOOD MANOR whole and " +
        "bright and full of the living.",
    },

    // --- the only thing in the space between the walls ---
    backwardsWatch: {
      names: ["watch", "pocket watch"], adjectives: ["backwards", "tarnished", "brass"],
      loc: "betweenWalls", takeable: true, treasure: true, points: 12,
      depositScoreFlag: "heirloomScore:backwardsWatch",
      roomDesc: "A tarnished BACKWARDS WATCH hangs from a bent nail, its hands sweeping the wrong way.",
      desc: "A brass pocket watch, badly tarnished, ticking backwards at a perfectly ordinary speed. It has " +
        "clearly been here since before there was a \"here.\" On the back, a family inscription reads: " +
        "\"B.W. — WHAT TIME TAKES, BLOOD REMEMBERS.\"",
    },
  },
};

// ---- handler function definitions referenced above --------------------------
function revealKey(ctx) {
  if (ctx.getFlag("statueMoved")) return "You have already taken what was hidden here.";
  ctx.setFlag("statueMoved");
  ctx.moveItem("frontKey", "garden");
  const points = awardProgress(ctx, "statueKeyRevealed");
  return "You heave the mossy statue aside. Beneath its plinth, half-sunk in the earth, lies a heavy iron key." +
    awardSuffix(points);
}
function revealSafe(ctx) {
  if (ctx.getFlag("safeRevealed")) return "The PROFILE PAINTING already hangs aside, baring the iron SAFE.";
  ctx.setFlag("safeRevealed");
  ctx.moveItem("safe", "parlor");
  const points = awardProgress(ctx, "safeRevealed");
  return "You swing the PROFILE PAINTING aside on a hidden hinge. Set into the wall behind it is a squat iron SAFE." +
    awardSuffix(points);
}
function revealWallGap(ctx) {
  if (ctx.getFlag("wallGapFound"))
    return "The gap in the wall stands open, dust-dark and waiting, right where you left it.";
  ctx.setFlag("wallGapFound", true);
  const points = awardProgress(ctx, "wallGapFound");
  return "You peel back a curling tongue of WALLPAPER — and keep peeling, because a whole panel of rotten " +
    "lath comes away in your hands, baring a gap just wide enough to squeeze IN, into the dark between the walls." +
    awardSuffix(points);
}

// --- Self-immolation & stop-drop-roll in ANY room (Andy's idea) --------------
// Inject a light/burn/extinguish interceptor into every room's handler table so
// the player can set themselves ablaze (or put themselves out) anywhere, without
// touching the generic engine. Each interceptor tries the self-fire path first,
// then falls back to any pre-existing room handler (returning null = fall through
// to the normal command).
for (const room of Object.values(world.rooms)) {
  room.on = room.on || {};
  const pLight = room.on.light, pBurn = room.on.burn, pExt = room.on.extinguish, pOff = room.on.off;
  const pYes = room.on.yes, pNo = room.on.no;
  room.on.light = (ctx, cmd) => selfLightInterceptor(ctx, cmd) ?? (pLight ? pLight(ctx, cmd) : null);
  room.on.burn = (ctx, cmd) => selfLightInterceptor(ctx, cmd) ?? (pBurn ? pBurn(ctx, cmd) : null);
  room.on.extinguish = (ctx, cmd) => selfExtinguishInterceptor(ctx, cmd) ?? (pExt ? pExt(ctx, cmd) : null);
  room.on.off = (ctx, cmd) => selfExtinguishInterceptor(ctx, cmd) ?? (pOff ? pOff(ctx, cmd) : null);
  room.on.yes = (ctx, cmd) => selfFireAnswerInterceptor(ctx, cmd) ?? (pYes ? pYes(ctx, cmd) : null);
  room.on.no = (ctx, cmd) => selfFireAnswerInterceptor(ctx, cmd) ?? (pNo ? pNo(ctx, cmd) : null);
}
