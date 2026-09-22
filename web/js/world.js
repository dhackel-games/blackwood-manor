// world.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-21.104:acoven.
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
import { composeWorld } from "./compose.js?v=source";
import { content } from "./world.content.js?v=source";
import { pathToRoom } from "./sysop-menu.js?v=source";

// ---- helpers used by handlers ------------------------------------------------
export const REQUIRED_FAMILY_ITEM_COUNT = 13;

export const ITEM_SHORT_NAMES = Object.freeze({
  reliquary: "rq",
  bell: "bell",
  belfryBellRope: "bellrope",
  belfryBats: "bats",
  bellCloset: "bellcloset",
  closetBellRope: "closetrope",
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
  dragonVaultDoor: "vaultd",
  caveTroll: "troll",
  dragonHoard: "hoard",
  backpack: "backpack",
  headlamp: "headlamp",
  wingedShoes: "shoes",
  familyCrest: "crest",
  hallBed: "hallbed",
  hallMirror: "hallmirror",
  mirrorShard: "shard",
  nightTable: "nightstand",
  nightDrawer: "drawer",
  bedsideLamp: "bedlamp",
  xrayGoggles: "goggles",
  frontDoor: "frontd",
  candlestick: "candlestick",
  candelabraFrame: "fixture",
  candelabra: "candelabra",
  matches: "matches",
  rope: "coil",
  cellarDoor: "cellard",
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
  rubyRing: "ravenblood",
  wraith: "wraith",
  goldLocket: "locket",
  cord: "cord",
  ancientCoin: "ancient",
  crystalDecanter: "decanter",
  ancestralPortrait: "ancestral",
  backwardsWatch: "woodblack",
  blackwoodHammer: "bmhammer",
  clockTalisman: "gclock",
  emeraldOfTheQueen: "qemerald",
  queenPetrified: "medusa",
  gardenPool: "gpool",
});

export const ROOM_SHORT_NAMES = Object.freeze({
  gate: "gate",
  garden: "garden",
  hedgeMazeGate: "yewgate",
  hedgeMazeKnot: "thornknot",
  hedgeMazeLoop: "loop",
  dragonCaveMouth: "mouth",
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
  masterBedroom: "grandbr",
  hallBedroom: "hallbr",
  study: "study",
  attic: "attic",
  roof: "roof",
  belfry: "belfry",
  hiddenVault: "astral",
  garysLair: "gary",
  betweenWalls: "between",
  p2_awakening: "nowhere",
  t13_medusaGarden: "hour13",
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
  if (ctx.getFlag("heirloomsTransformed")) {
    return {
      contributing: REQUIRED_FAMILY_ITEM_COUNT,
      required: REQUIRED_FAMILY_ITEM_COUNT,
      nonContributing: 0,
      transformed: true,
    };
  }
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
function reliquaryStatusValue(ctx, includeEmpty = false) {
  const status = reliquaryStatus(ctx);
  if (!status) {
    return includeEmpty ? `0/${REQUIRED_FAMILY_ITEM_COUNT} +0` : null;
  }
  if (status.transformed) return "CLOCK";
  return `${status.contributing}/${status.required} +${status.nonContributing}`;
}
function reliquaryCountLine(ctx) {
  return `HEIRLOOMS: ${reliquaryStatusValue(ctx, true)}`;
}

// Persist the final score as a seed for BLACKWOOD MANOR II. Browser-only; the
// node test harness has no localStorage, so this is a guarded nice-to-have.
function saveBm2Seed(ctx) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("blackwood-bm2-seed-v1", JSON.stringify({
        score: ctx.state.score,
        turns: ctx.state.turns,
        playerName: ctx.getFlag("playerName"),
        holdsClock: true,
        savedAt: Date.now(),
      }));
    }
  } catch { /* storage unavailable — the seed is optional */ }
}

function transformHeirloomsIntoClock(ctx) {
  for (const [id, definition] of Object.entries(ctx.world.items)) {
    if (definition.treasure) ctx.moveItem(id, "clockTalisman");
  }
  ctx.moveItem("clockTalisman", "reliquary");
  ctx.setFlag("heirloomsTransformed", true);
}

function inspectReliquary(ctx) {
  if (ctx.getFlag("heirloomsTransformed")) {
    if (ctx.roomOf("clockTalisman") === "reliquary") {
      return "The thirteen fitted recesses are empty. The heirlooms have not merely disappeared: in their " +
        "place sits a beautiful COUNTDOWN CLOCK with thirteen numbers and one hand resting on XIII. Somehow, " +
        "all thirteen heirlooms have become this single clock. Open the RELIQUARY and TAKE it.";
    }
    return "All thirteen fitted recesses are empty. The heirlooms became the COUNTDOWN CLOCK you now carry.";
  }
  return "A tall, glass-fronted RELIQUARY set into the stone wall, with thirteen fitted recesses for the " +
    `Blackwood heirlooms.\n\n${reliquaryCountLine(ctx)}`;
}

function takeCountdownClock(ctx) {
  if (ctx.roomOf("clockTalisman") !== "reliquary") {
    return ctx.has("clockTalisman") ? "You already carry the COUNTDOWN CLOCK." : null;
  }
  ctx.moveItem("clockTalisman", "inventory");
  return "You lift the COUNTDOWN CLOCK from the RELIQUARY. It is lighter than thirteen heirlooms should be. " +
    "The open trapdoor waits beside you, its narrow STAIRCASE descending into the dark.";
}

function ringBelfryBell(ctx, fromBelfry = true) {
  const result = fromBelfry
    ? "You haul the rope down with both hands.\n\nDONG... DONG...\n\n"
    : "You pull the lower rope. Far above, almost too remote to belong to this room:\n\n" +
      "DONG... DONG...\n\n";
  if (ctx.getFlag("belfryBatsScattered")) {
    return result + "The great BELL rolls its voice across the roof. The belfry is already empty of bats.";
  }
  ctx.setFlag("belfryBatsScattered", true);
  ctx.moveItem("belfryBats", null);
  const gogglesWereHidden = ctx.roomOf("xrayGoggles") == null;
  if (gogglesWereHidden) ctx.moveItem("xrayGoggles", "belfry");
  const points = awardProgress(ctx, "belfryGogglesFreed");
  return result + (fromBelfry
    ? "Hundreds of BATS burst from the rafters in a black cyclone." +
      (gogglesWereHidden
        ? " In their panic they release something hidden above the bell: antique XRAY GOGGLES in a " +
          "blackened-brass frame. They strike the boards and skid to your feet, the BM monogram still bright."
        : "")
    : "A violent storm of wings erupts somewhere high above. After it fades, something strikes the floor " +
      "overhead with a sharp metallic CLUNK.") +
    awardSuffix(points);
}

function resolveWatchRoom(ctx, phrase) {
  const wanted = String(phrase || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!wanted) return null;
  const matches = Object.entries(ctx.world.rooms)
    .filter(([, room]) => room.phase !== 2)
    .filter(([id, room]) =>
      [ctx.world.roomShortNames?.[id], id, room.name, ...(room.aliases || [])]
        .filter(Boolean)
        .some((name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, "") === wanted));
  return matches.length === 1 ? matches[0] : null;
}

function containingRoom(ctx, item) {
  let location = ctx.roomOf(item.id);
  const seen = new Set();
  while (location && !seen.has(location)) {
    if (location === "inventory") return ctx.state.room;
    if (ctx.world.rooms[location]) return location;
    seen.add(location);
    const container = ctx.item(location);
    if (!container) return null;
    location = ctx.roomOf(container.id);
  }
  return null;
}

function resolveWatchDestination(ctx, phrase) {
  const roomMatch = resolveWatchRoom(ctx, phrase);
  if (roomMatch) {
    const [roomId, room] = roomMatch;
    return { roomId, room, label: room.name };
  }
  const destinations = Object.values(ctx.state.items).map((item) => {
    const roomId = containingRoom(ctx, item);
    const room = roomId ? ctx.world.rooms[roomId] : null;
    return room && room.phase !== 2
      ? { roomId, room, item, label: item.names[0] }
      : null;
  }).filter(Boolean);
  const matches = ctx.findItems(phrase, destinations.map(({ item }) => item)) || [];
  if (matches.length !== 1) return null;
  return destinations.find(({ item }) => item.id === matches[0].id) || null;
}

function prepareWatchRoute(ctx, roomId) {
  ctx.setFlag("mirrorRoutePrefill", null);
  try {
    const route = pathToRoom(ctx, roomId).map((step) =>
      step === "u" ? "up" : step === "d" ? "dn" : step);
    if (route.length) ctx.setFlag("mirrorRoutePrefill", route.join("; "));
    return route.length
      ? `\n\nROUTE READY\n${route.join("; ")}`
      : "\n\nROUTE READY\nYou are already there.";
  } catch {
    return "\n\nNo currently traversable route reaches that room.";
  }
}

function lookThroughWoodblackWatch(ctx, cmd) {
  const target = cmd.verb === "show" ? cmd.dobj : cmd.iobj;
  if (!target) {
    return inspectWoodblackWatch(ctx) + "\n\nThe black crystal waits for a destination. Try SHOW KITCHEN, " +
      "SHOW KITCHEN IN WATCH, LOOK IN WATCH AT KITCHEN, or ROUTE TO DIARY.";
  }
  if (!ctx.has("backwardsWatch")) {
    return "You need to take or wear the WOODBLACK WATCH before you can look through it.";
  }
  ctx.setFlag("mirrorRoutePrefill", null);
  const match = resolveWatchRoom(ctx, target);
  if (!match) return `The WOODBLACK WATCH finds no room called "${target}".`;
  const [roomId, room] = match;
  const description = typeof room.desc === "function" ? room.desc(ctx) : room.desc;
  const visionSource = room.highDesc || room.searchDesc;
  const vision = typeof visionSource === "function" ? visionSource(ctx) : visionSource;
  const shapes = ctx.itemsIn(roomId)
    .map((item) => item.roomDesc || item.names?.[0])
    .filter(Boolean);
  const routeText = prepareWatchRoute(ctx, roomId);
  return `WOODBLACK WATCH — ${room.name.toUpperCase()}\n` +
    (room.art ? MAP_MARK + room.art + MAP_MARK + "\n" : "") +
    `${description || "The room lies silent."}` +
    (vision ? `\n\nTHIRD EYE\n${vision}` : "") +
    (shapes.length ? `\n\nShapes in the room:\n${shapes.map((shape) => `* ${shape}`).join("\n")}` : "") +
    routeText;
}

function routeWithWoodblackWatch(ctx, cmd) {
  ctx.setFlag("mirrorRoutePrefill", null);
  if (!ctx.has("backwardsWatch")) {
    return "You need the WOODBLACK WATCH before you can GUIDE, PATH, or ROUTE to a room or object.";
  }
  const target = cmd.dobj || cmd.iobj;
  if (!target) return "Route to what?";
  const destination = resolveWatchDestination(ctx, target);
  if (!destination) return `The WOODBLACK WATCH finds no room or object called "${target}".`;
  const where = destination.item
    ? `${destination.label.toUpperCase()} is in ${destination.room.name.toUpperCase()}.`
    : destination.room.name.toUpperCase();
  return `WOODBLACK WATCH ROUTE — ${destination.label.toUpperCase()}\n${where}` +
    prepareWatchRoute(ctx, destination.roomId);
}

function hallBedroomSearch(ctx) {
  const shardStillSet = ctx.roomOf("mirrorShard") === "hallBedroom"
    && !ctx.getFlag("mirrorShardFreed");
  const drawer = ctx.item("nightDrawer");
  return "The BED is untouched. " +
    (shardStillSet
      ? "The MIRROR'S central SHARD shifts when touched and looks as though it could be worked free. "
      : "The broken MIRROR'S center is an empty, hand-sized gap. ") +
    `The NIGHT TABLE'S BM-handled DRAWER is ${drawer?.open ? "open" : "closed"}.`;
}

function inspectHallMirror(ctx) {
  const shardStillSet = ctx.roomOf("mirrorShard") === "hallBedroom"
    && !ctx.getFlag("mirrorShardFreed");
  return shardStillSet
    ? "The HALL BEDROOM MIRROR is broken in a web around one palm-sized central SHARD. The shard is loose " +
        "enough to TAKE or PULL free without bringing down the rest of the glass. What remains gives you back " +
        "as a reflection standing slightly farther away than it should."
    : "The HALL BEDROOM MIRROR is broken around a jagged, hand-sized hole where its central SHARD used to be. " +
        "What remains gives you back as a reflection standing slightly farther away than it should.";
}

function freeMirrorShard(ctx) {
  const shard = ctx.item("mirrorShard");
  if (ctx.has("mirrorShard")) return "You already carry the MIRROR SHARD.";
  if (shard?.loc !== "hallBedroom" || ctx.getFlag("mirrorShardFreed")) return null;
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
    return "Your hands are full. You cannot safely work the MIRROR SHARD free.";
  }
  ctx.moveItem("mirrorShard", "inventory");
  ctx.setFlag("mirrorShardFreed", true);
  return "You brace the broken frame and work the central MIRROR SHARD free. Its reflective face catches your " +
    "eye; its blackened, nonreflective back carries only half an inscription.";
}

function candelabraFixtureDescription(ctx) {
  const hasShard = !!ctx.getFlag("candelabraShardInstalled");
  const hasCandle = !!ctx.getFlag("candelabraCandleInstalled");
  if (hasShard && !hasCandle) {
    return "The MIRROR SHARD now fits the rundown CANDELABRA'S central recess perfectly, but the letters across " +
      "its back remain dull. The single candle socket above it is still empty.";
  }
  if (hasCandle && !hasShard) {
    return "The manor's sole CANDLE stands in the rundown CANDELABRA'S socket. Its central mirror-shaped recess " +
      "is still empty, and the inscription around the base still ends: \"WHEN THE LAST LIGHT MEETS BROKEN—\"";
  }
  return "A rundown silver CANDELABRA is fixed to the dining table. One central socket waits for a single CANDLE, " +
    "and beneath it a mirror-shaped recess breaks an inscription that ends: " +
    "\"WHEN THE LAST LIGHT MEETS BROKEN—\"";
}

function diningRoomSearch(ctx) {
  if (ctx.getFlag("candelabraRestored")) {
    return ctx.roomOf("candelabra") === "diningRoom"
      ? "The restored CANDELABRA burns without consuming its candle. The complete inscription circles its base."
      : "Fresh scratches and a clean silver outline show where the restored CANDELABRA was lifted from the table.";
  }
  return candelabraFixtureDescription(ctx) + (ctx.roomOf("candlestick") === "diningRoom"
    ? " The dry CANDLE beside it will take the manor's single MATCH."
    : "");
}

function restoreCandelabra(ctx, installedPiece) {
  ctx.moveItem("candelabraFrame", null);
  ctx.moveItem("candelabra", "diningRoom");
  ctx.setFlag("candelabraRestored", true);
  ctx.item("candelabra").lit = true;
  return installedPiece + "\n\nThe fitted shard catches the candle's first impossible spark. Silver branches " +
    "straighten with a ringing sigh, and five blue-white flames flower across them without consuming the wax. " +
    "The rundown fixture has become a beautiful, portable BLACKWOOD CANDELABRA.\n\n" +
    "Around its base, the inscription is complete at last: " +
    "\"BM — WHEN THE LAST LIGHT MEETS BROKEN GLASS, THE HOUSE REMEMBERS.\"";
}

function installCandelabraPiece(ctx, cmd) {
  if (ctx.getFlag("candelabraRestored")) return "The BLACKWOOD CANDELABRA is already whole.";
  const piece = cmd.itemId
    ? ctx.item(cmd.itemId)
    : ctx.find(cmd.dobj, ctx.inventory());
  if (!piece || !ctx.has(piece.id)) return `You need to be carrying the ${cmd.dobj || "piece"} first.`;
  if (!["mirrorShard", "candlestick"].includes(piece.id)) {
    return `The ${piece.names[0].toUpperCase()} fits neither the narrow candle socket nor the central mirror recess.`;
  }

  if (piece.id === "mirrorShard") {
    if (ctx.getFlag("candelabraShardInstalled")) return "The MIRROR SHARD is already fitted into the central recess.";
    ctx.moveItem(piece.id, null);
    ctx.setFlag("candelabraShardInstalled", true);
    const installed = "You press the MIRROR SHARD into the central recess. It settles flush with a tiny silver click, " +
      "but its half of the inscription remains soot-dark.";
    return ctx.getFlag("candelabraCandleInstalled")
      ? restoreCandelabra(ctx, installed)
      : installed + " The empty candle socket above it still waits.";
  }

  if (ctx.getFlag("candelabraCandleInstalled")) return "The sole CANDLE is already seated in the candelabra.";
  const wasLit = !!piece.lit;
  piece.lit = false;
  ctx.moveItem(piece.id, null);
  ctx.setFlag("candelabraCandleInstalled", true);
  const installed = "You seat the manor's sole CANDLE in the candelabra's central socket." +
    (wasLit ? " Its ordinary flame gutters out as the silver grips it." : "");
  return ctx.getFlag("candelabraShardInstalled")
    ? restoreCandelabra(ctx, installed)
    : installed + " The mirror-shaped recess beneath it is still empty.";
}

function touchCandelabra(ctx, cmd) {
  const target = `${cmd.iobj || ""} ${cmd.dobj || ""}`.toLowerCase();
  if (!/\bbrazier\b/.test(target) || ctx.state.room !== "garden") return null;
  if (!ctx.has("candelabra")) return "You need to carry the CANDELABRA to touch its flame to the BRAZIER.";
  return lightBrazier(ctx);
}

function keepCandelabraLit(ctx) {
  ctx.item("candelabra").lit = true;
  return "You try to smother the CANDELABRA'S blue-white flames. They bend around your hand and rise again, " +
    "steady and untouched. This fire has no fuel to spend.";
}

function pullClosetBellRope(ctx) {
  const bell = ringBelfryBell(ctx, false);
  if (ctx.getFlag("bellRung")) {
    return bell + "\n\nThe ritual has already answered. The FRONT DOOR and floor trapdoor remain open.";
  }
  if (!allTreasuresDeposited(ctx)) {
    return bell + "\n\nNothing changes in the RELIQUARY.\n\n" + reliquaryCountLine(ctx);
  }
  if (ctx.item("reliquary").open || !ctx.getFlag("reliquarySealed")) {
    return bell + "\n\nA white spark crawls across the open RELIQUARY and dies. CLOSE the doors first.";
  }

  ctx.setFlag("bellRung", true);
  ctx.setFlag("floorDoorOpen", true);
  transformHeirloomsIntoClock(ctx);
  const frontDoor = ctx.item("frontDoor");
  frontDoor.locked = false;
  frontDoor.open = true;
  ctx.setFlag("frontDoorOpen", true);
  const points = awardProgress(ctx, "bellRung");
  return bell +
    "\n\nA flash of magical white light fills the RELIQUARY. Every heirloom vanishes.\n\n" +
    "The FRONT DOOR seizes the room's attention: it SLAMS SHUT hard enough to shake the walls, pauses, " +
    "then swings WIDE OPEN onto the night.\n\n" +
    "Only then does the floor answer. A trapdoor beside the RELIQUARY swings open, revealing a narrow " +
    "STAIRCASE DOWN.\n\n" +
    "Behind the reliquary glass, one unfamiliar shape now rests where the heirlooms were." +
    awardSuffix(points);
}

function leaveThroughFrontDoor(ctx) {
  const fireSurvival = surviveSelfFire(ctx);
  return ctx.win(
    "You cross the threshold beneath the wide-open FRONT DOOR. Cold night air strikes your face, and the " +
    "whole manor exhales behind you.\n\n" +
    "You keep walking, {{player_name}}. Blackwood Manor does not call you back." +
    fireSurvival
  );
}

// Carrying the transformed clock opens the floor stair. Gary is waiting below,
// alone and off the phone; he knocks the player loose from their body and runs.
function garyEnding(ctx) {
  const scene =
    "You descend the impossible stair into a low, damp room lit by a single bare bulb.\n\n" +
    "GARY sits at a battered desk beside an avocado-green ROTARY PHONE. The receiver rests silently in " +
    "its cradle. No caller. No ringing. Just Gary, a cold BURRITO, a heap of MUSHROOMS, and a sweating " +
    "carton of MILK beside the humming mini-FRIDGE.\n\n" +
    "He looks up. Surprise holds him still for one heartbeat. Then he sees the COUNTDOWN CLOCK in your " +
    "hands, and his whole face breaks open with excitement.\n\n" +
    "\"{{player_name}},\" he says. \"You rang the bell. You brought the clock. You actually did it.\"\n\n" +
    "He snatches the heavy receiver from its cradle and rises. \"Do you have any idea what that means for me?\"\n\n" +
    "The receiver catches you across the temple with a bright electric CLANG. The floor tilts. The last " +
    "thing you see is Gary taking the stairs three at a time toward the open front door, howling one word " +
    "into the dark:\n\n" +
    MAP_MARK + GARY_LAIR_ART + MAP_MARK + "\n\n" +
    "\"FREEEEDOMMM!\"";
  saveBm2Seed(ctx);
  // ONE GAME: the blow no longer ends the story — it knocks you loose in time.
  // Blackwood Manor II begins right here, in the same session, same page.
  return scene + "\n\n" + beginPartII(ctx);
}

// =============================================================================
// BLACKWOOD MANOR II — THE THIRTEEN-HOUR CLOCK  (Part II: one continuous game)
// -----------------------------------------------------------------------------
// Gary's blow knocks you OUT of your body. You wake as a ghost with the clock,
// but its purpose is not revealed until you EXAMINE it. Part II reuses the SAME
// manor as Part I (you walk the real rooms as a ghost); only the time-scenes
// are new. This BUILD SLICE implements the thirteenth hour: recover the QUEEN'S
// EMERALD from the petrifying queen, then return it to the present-day GARDEN.
// Placing it ticks the clock 13 -> 12. (Hours XII..I and the closing of the
// ouroboros are still to be built.)
// =============================================================================
const P2_ROMAN = { 13: "XIII", 12: "XII", 11: "XI", 10: "X", 9: "IX", 8: "VIII",
  7: "VII", 6: "VI", 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I", 0: "—" };
function p2Roman(n) { return P2_ROMAN[n] || String(n); }
function p2Hour(ctx) { const h = ctx.getFlag("clockHour"); return h == null ? 13 : h; }

// The hinge: called from garyEnding. Become the ghost and drop into "Nowhere."
// The game stays ALIVE (never finish/kill).
function beginPartII(ctx) {
  ctx.setFlag("partII", true);
  ctx.setFlag("clockExplained", false);
  if (ctx.getFlag("clockHour") == null) ctx.setFlag("clockHour", 13);
  ctx.moveItem("clockTalisman", "inventory");
  ctx.state.room = "p2_awakening";
  const awakening = describeAwakening(ctx);
  ctx.setCheckpoint("partII", awakening);
  return awakening;
}

function describeAwakening(ctx) {
  return "· · · · ·\n\n" +
    "...and then you wake somewhere cold, lightless, and NOWHERE.\n\n" +
    "There is no body beneath you. Your hands are translucent. You are a ghost, {{player_name}}, and the " +
    "COUNTDOWN CLOCK is still cradled in your see-through fingers.\n\n" +
    "Gary is gone. The clock remains.\n\n" +
    "EXAMINE the CLOCK.";
}

function afterPlayerNamed(ctx) {
  return ctx.getFlag("partII") && ctx.state.room === "p2_awakening"
    ? describeAwakening(ctx)
    : ctx.describeRoom(true);
}

function clockTalismanText(ctx) {
  if (!ctx.getFlag("partII")) {
    return "A beautiful grand clock small enough to cradle in both hands. It has THIRTEEN numbers instead of " +
      "twelve, and one slender hand resting on XIII. There is no maker's mark and no instruction.";
  }
  ctx.setFlag("clockExplained", true);
  return "The moment your ghostly fingers trace the clock's face, its purpose enters your mind whole.\n\n" +
    "The thirteen Blackwood heirlooms are inside it, scattered through thirteen hours of the manor's past. " +
    "The hand will count backward only when you recover each heirloom and return it to the place where you " +
    "first found it. USE the CLOCK to enter the next hour; USE it again to come home with what you recover.\n\n" +
    `The hand rests on ${p2Roman(p2Hour(ctx))}. Thirteen hours remain, {{player_name}}.`;
}

// The clock is the only way in or out of an hour.
//   * Nowhere / present-day manor, not holding the emerald -> FALL into hour XIII.
//   * Inside hour XIII holding the emerald -> SURFACE in the present-day hall.
//   * Present-day manor, already holding it -> nudge you to walk it to the garden.
function useClockTalisman(ctx) {
  if (!ctx.getFlag("partII")) {
    return "The clock ticks once in your hands. Beneath it, the open stair waits in the floor.";
  }
  const room = ctx.state.room;
  if (p2Hour(ctx) <= 12) {
    return "The clock's hand has slipped past the thirteenth hour and rests on XII. Beyond here the road through " +
      "time isn't built yet — this is the end of the current slice. (Hours XII..I are still to come.)";
  }
  if (room === "p2_awakening") {
    if (!ctx.getFlag("clockExplained")) {
      return "The clock refuses to turn for a ghost who does not yet understand it. EXAMINE the CLOCK first.";
    }
    ctx.state.room = "t13_medusaGarden";
    return "You tip forward into the clock face, and FALL —\n\n" + describeMedusaGarden(ctx);
  }
  if (room === "t13_medusaGarden") {
    if (ctx.has("emeraldOfTheQueen")) {
      ctx.state.room = "grandHall";
      return "You fold your hand around the EMERALD and let the clock reel you home —\n\n" +
        "You surface in the ROYAL HALL of the present-day manor, the emerald cold and heavy in your grip. The " +
        "sealed reliquary stands silent; the great BELL is spent.\n\n" +
        ctx.describeRoom(true) + "\n\n" +
        "The emerald belongs where it once fell — out in the GARDEN, deep in the bush beneath the leaning STATUE. " +
        "Make your way there and PUT it.";
    }
    return "The clock's hand shudders but will not turn. The EMERALD is still at the queen's throat — free it first.";
  }
  if (ctx.has("emeraldOfTheQueen")) {
    return "You already carry the EMERALD. It belongs out in the GARDEN, in the bush beneath the leaning STATUE. " +
      "Make your way there and PUT it.";
  }
  ctx.state.room = "t13_medusaGarden";
  return "You tip into the clock face, and FALL —\n\n" + describeMedusaGarden(ctx);
}

function describeMedusaGarden(ctx) {
  if (ctx.getFlag("emeraldFreed")) {
    return "THE THIRTEENTH HOUR — after.\n\n" +
      "The garden of centuries past, gone silent. Where the queen stood there is now only a grey STATUE, caught " +
      "mid-turn, an empty setting at its throat. There is nothing left to do here. USE the CLOCK to return.";
  }
  return "THE THIRTEENTH HOUR.\n\n" +
    "You stand where the manor GARDEN will be — drenched in the green-gold light of an afternoon centuries gone. " +
    "At the garden's heart, where in your own time a marble STATUE of a woman keeps its vigil, the roses are " +
    "already greying and hardening to STONE, inch by creeping inch. Whatever casts that curse is near — and if it " +
    "is what you suspect, you must not simply walk up and let it look at you.\n\n" +
    "Beside you a garden POOL lies mirror-still. EXAMINE the STATUE's place to find who waits there.";
}

function wailAtQueen(ctx) {
  if (ctx.state.room !== "t13_medusaGarden") return null;
  if (ctx.getFlag("emeraldFreed")) return "The queen is stone and the garden is still. USE the CLOCK to return.";
  if (!ctx.getFlag("queenFound")) {
    return "You loose a wail into the rose-maze — but you haven't even found her, and the sound only scatters a " +
      "flock of stone-grey birds. In your own time a STATUE of a woman stands at the garden's heart; EXAMINE that " +
      "place to find her first.";
  }
  if (!ctx.getFlag("poolKnown")) {
    return ctx.kill(
      "You gather the whole of your death into a WAIL. The queen spins toward the sound — but you have set nothing " +
      "between you, and her petrifying gaze finds YOU square on before you can flinch. The cold climbs your " +
      "see-through limbs and sets them fast; the last thing you understand is that you should have made her look " +
      "at the still WATER instead of at you.");
  }
  ctx.setFlag("emeraldFreed", true);
  ctx.moveItem("emeraldOfTheQueen", "inventory");
  return "You gather the whole of your death into a single WAIL, and loose it across the garden.\n\n" +
    "The queen startles and spins toward the sound — but you have set yourself so the mirror-still POOL lies " +
    "between you. Her own petrifying gaze rakes across the water and rebounds full into her face. She freezes " +
    "mid-turn, emerald silk and pale skin greying to STONE. The great EMERALD tears loose from her throat and " +
    "drops; you catch it out of the air before it can shatter.\n\n" +
    "You hold the QUEEN'S EMERALD. USE the CLOCK to carry it back to the present.";
}

// Item-scoped PUT/DROP on the emerald: only the present-day GARDEN accepts it.
function placeEmeraldInGarden(ctx) {
  if (!ctx.getFlag("partII")) return null;
  if (ctx.state.room !== "garden") {
    return "Not here. The QUEEN'S EMERALD belongs out in the GARDEN, in the bush beneath the leaning STATUE — the " +
      "very stone the queen became. Make your way there, then PUT it.";
  }
  ctx.moveItem("emeraldOfTheQueen", "garden");
  ctx.setFlag("clockHour", 12);
  ctx.setFlag("hour13Done", true);
  ctx.addScore(25);
  return "You press the QUEEN'S EMERALD deep into the bush beneath the leaning STATUE — the petrified queen " +
    "herself, you understand now — where, centuries on, a treasure-hunter will dig it out by lantern-light and " +
    "carry it inside. The circle draws that much tighter.\n\n" +
    "Far off and everywhere at once, the great BELL tolls once. The clock's slender hand slips from XIII to XII.\n\n" +
    MAP_MARK + " HOUR XIII CLOSED — the emerald is home. Twelve hours remain. " + MAP_MARK + "\n\n" +
    "(End of the current build slice: Hours XII..I and the closing of the loop are still to come.)";
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
  "                      (then close the reliquary and pull the closet bell rope)",
  "  su maxscore         set the maximum attainable score",
  "  su win              jump to the front-door ending",
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
  letterRead: 5,
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
  belfryGogglesFreed: 5,
  mushroomVisionOpened: 10,
  atticLadderLowered: 5,
  reliquarySealed: 5,
  bellRung: 5,
  burritoSurvived: 25,
  selfFireSurvived: 10,
});
const STANDALONE_MAX_AWARDS = Object.freeze({
  milk: 5,
  obsidianEye: 15,
  brazier: 30,
  dreadmaw: 10,
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
      return requiredOnly
        ? `[su] deposited ${n} required heirloom(s) (+${pts}). The closet BELL ROPE is ready.`
        : `[su] deposited ${n} treasure(s) (+${pts}). The closet BELL ROPE is ready.\n` +
          "Go to the ROYAL HALL, CLOSE RELIQUARY, OPEN BELL CLOSET, then PULL BELLROPE.";
    }
    case "win": case "escape": {
      ctx.setFlag("bellRung", true);
      ctx.setFlag("frontDoorOpen", true);
      ctx.item("frontDoor").locked = false;
      ctx.item("frontDoor").open = true;
      ctx.state.room = "grandHall";
      return leaveThroughFrontDoor(ctx);
    }
    case "gary": case "end": case "badending": case "cliffhanger": {
      ctx.setFlag("bellRung", true);
      ctx.setFlag("heirloomsTransformed", true);
      ctx.setFlag("floorDoorOpen");
      ctx.moveItem("clockTalisman", "inventory");
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
function hintEntries(ctx) {
  const dep = (id) => ctx.roomOf(id) === "reliquary";
  const inside = ctx.getFlag("frontDoorOpen");
  const candle = ctx.item("candlestick");
  const candelabra = ctx.item("candelabra");
  const lit = (candle?.loc === "inventory" && candle.lit)
    || (candelabra?.loc === "inventory" && candelabra.lit);
  const frontDoorHint = ctx.getFlag("statueMoved") || ctx.has("frontKey")
    || ctx.roomOf("frontKey") === "garden"
    ? "You've got the iron key — or it's sitting right there in the garden. TAKE it, go to the PORCH, then UNLOCK DOOR WITH IRON KEY, OPEN DOOR, and go NORTH. That's the entire trick."
    : "The front door's locked, shocker. Some genius buried the key under that leaning STATUE in the garden. MOVE the statue, grab the key, then unlock the front door. In you go. Riveting.";
  const lightHint = ctx.roomOf("matches") === null
    ? "You burned your only match already, didn't you. DIDN'T YOU. The CANDLE is still useful in the DINING ROOM'S restoration puzzle, but it will not light by itself until the CANDELABRA is whole."
    : "You want to survive downstairs? TAKE the CANDLE in the DINING ROOM and the MATCHES in the KITCHEN, then LIGHT CANDLE. You get exactly ONE match. Try to rise to the occasion.";
  const coinHint = ctx.has("rope")
    ? "You've got the rope, congratulations. Go to the garden and ENTER WELL — or just go DOWN. Coin's at the bottom. Try not to end up down there permanently."
    : "There's a coin down the garden WELL. Go down without a ROPE and you SPLATTER — dead, instantly, no do-overs. There's a rope in the KITCHEN. Get it FIRST. I cannot stress this enough.";
  const dragonHint = !ctx.getFlag("dragonMoved")
    ? "A family heirloom, the BLACKWOOD FAMILY CREST, waits in DREADMAW'S VAULT. Bring the kitchen APPLE through the HEDGE MAZE and OFFER APPLE TO DRAGON."
    : !ctx.getFlag("dragonVaultOpen")
      ? "Follow DREADMAW'S cave through the ANTECHAMBER and MINING GALLERY. WEAR the HEADLAMP, go DOWN, TAKE the BACKPACK in the DEEP SHAFT, then TALK TO TROLL at the TROLL GATE."
      : "The VAULT is open. TAKE the BLACKWOOD FAMILY CREST and PUT it in the RELIQUARY.";
  const oakHint = !ctx.getFlag("brazierLit")
    ? "The missing GEM for the GREAT OAK'S PANEL is hidden in the GARDEN BRAZIER. A lone match is too brief: carry the LIT CANDLE, carry the restored CANDELABRA, or LIGHT YOURSELF ON FIRE first."
    : !ctx.getFlag("oakLightAligned")
      ? "TAKE the EMERALD GEM, then follow the path EAST through the PRIVY to the GREAT OAK. EXAMINE the PANEL and PLACE the gems into its BOTTOM, MIDDLE, and TOP SLOTS until the mirrored sunlight converges."
      : ctx.roomOf("spyglass") === "treeFort"
        ? "The oak's PLATFORM alternates between the roots and TREE FORT. ENTER PLATFORM while it's beside you, WAIT for it to rise, then TAKE the BM SPYGLASS."
        : "The BM SPYGLASS from the TREE FORT is the heirloom. PUT SPYGLASS IN RELIQUARY.";
  const hammerHint = !ctx.getFlag("wallGapFound")
    ? "The NURSERY'S loose WALLPAPER hides a crawl-gap. PULL WALLPAPER and go IN; a BM-marked BLACKWOOD HAMMER lies in the sawdust between the beams."
    : ctx.roomOf("blackwoodHammer") === "betweenWalls"
      ? "Go IN through the NURSERY wall-gap and TAKE the BLACKWOOD HAMMER from the sawdust."
      : "The BM HAMMER is a family heirloom. PUT BMHAMMER IN RELIQUARY.";
  const gogglesHint = !ctx.getFlag("belfryBatsScattered")
    ? "One heirloom is hidden among the BATS in the BELFRY. Reach the ROOF, go EAST, then PULL the upper BELL ROPE."
    : ctx.roomOf("xrayGoggles") === "belfry"
      ? "The bats dropped BLACKWOOD XRAY GOGGLES onto the BELFRY floor. TAKE them."
      : "The XRAY GOGGLES are the belfry heirloom. REMOVE them if worn, then PUT GOGGLES IN RELIQUARY.";
  const candelabraHint = ctx.getFlag("candelabraRestored")
    ? "The restored CANDELABRA is the dining-room heirloom. PUT CANDELABRA IN RELIQUARY when you no longer need its flame."
    : ctx.roomOf("mirrorShard") === "hallBedroom"
      ? "The DINING ROOM'S rundown CANDELABRA is missing part of its inscription. EXAMINE the broken MIRROR in the HALL BEDROOM and work its loose SHARD free."
      : "The rundown CANDELABRA needs the MIRROR SHARD in its central recess and the manor's sole CANDLE in its socket. Either piece can go in first.";
  const watchHint = ctx.roomOf("backwardsWatch") === "nightDrawer"
    ? "The HALL BEDROOM'S NIGHT TABLE DRAWER holds the WOODBLACK WATCH. Wear it on your WRIST; SHOW a room or ROUTE TO an object and its black glass will guide you."
    : "The WOODBLACK WATCH can SHOW any Part-I room and prepare a ROUTE to any known room or object.";

  return [
    { topics: ["front", "door", "key", "statue", "garden", "porch"], done: inside, text: frontDoorHint },
    { topics: ["light", "dark", "candle", "candlestick", "match", "matches"], done: !!lit, text: lightHint },
    { topics: ["ravenblood", "ring", "jewelry", "tiny", "key"], done: dep("rubyRing"),
      text: "The RAVENBLOOD RING is locked in a jewelry box in the GRAND BEDROOM. The little key's inside the MUSIC BOX in the NURSERY — OPEN the music box, take the tiny key, then UNLOCK JEWELRY BOX WITH TINY KEY." },
    { topics: ["music", "box", "musicbox", "heirloom"], done: dep("musicBox"),
      text: "Don't leave the JEWELED MUSIC BOX behind — the box ITSELF is a Blackwood heirloom, not just the tiny key's shell. Once you've got the tiny key out, TAKE the music box and PUT it in the RELIQUARY too." },
    { topics: ["coin", "well", "rope", "garden"], done: dep("ancientCoin"), text: coinHint },
    { topics: ["grimoire", "library", "lever", "bookcase", "chamber"], done: dep("grimoire"),
      text: "In the LIBRARY there's a brass LEVER where a book should be. PULL it — a bookcase swings open onto a stair DOWN to a hidden chamber. The grimoire's there. Bring your lit candle; it's black as pitch." },
    { topics: ["decanter", "wine", "cellar", "trapdoor"], done: dep("crystalDecanter"),
      text: "Crystal decanter's in the WINE CELLAR. OPEN the CELLAR trap-door in the KITCHEN, go DOWN. Pitch dark — candle had better be lit or you're a grue's dinner. Unlike me, who has eaten NOTHING." },
    { topics: ["portrait", "attic", "ladder", "cord", "landing"], done: dep("ancestralPortrait"),
      text: "There's an ANCESTRAL PORTRAIT in the ATTIC. PULL the CORD on the LANDING to drop the ladder. But that ladder's rotten — climb it carrying more than a couple things and you crash through and DIE. DROP your junk on the landing first." },
    { topics: ["locket", "crypt", "wraith", "diary", "safe", "talisman"], done: dep("goldLocket"),
      text: "The gold locket's in the CRYPT, past the WINE CELLAR — guarded by a WRAITH that kills you on sight. So: READ the DIARY in the STUDY for the safe combo, MOVE the PROFILE PAINTING in the PARLOR, OPEN the SAFE, take the TALISMAN, WEAR it, THEN walk into the CRYPT. In that order. Write it down." },
    { topics: ["talisman", "amulet", "wraith", "locket"], done: dep("talisman"),
      text: "The TALISMAN that protected you from the WRAITH bears the BM crest on its back. Once the GOLD LOCKET is safely recovered, REMOVE TALISMAN and PUT it in the RELIQUARY as another family heirloom." },
    { topics: ["dragon", "dreadmaw", "apple", "maze", "troll", "vault", "crest", "cave"], done: dep("familyCrest"), text: dragonHint },
    { topics: ["oak", "tree", "fort", "spyglass", "gem", "panel", "brazier", "platform"], done: dep("spyglass"), text: oakHint },
    { topics: ["candelabra", "candle", "candlestick", "shard", "mirror", "dining", "light"],
      done: dep("candelabra"), text: candelabraHint },
    { topics: ["hammer", "blackwood", "bm", "wallpaper", "nursery", "wall", "gap"],
      done: dep("blackwoodHammer"), text: hammerHint },
    { topics: ["bat", "bats", "goggles", "xray", "belfry", "bell", "rope"],
      done: dep("xrayGoggles"), text: gogglesHint },
    { topics: ["watch", "woodblack", "scry", "show", "route", "guide"],
      done: ctx.roomOf("backwardsWatch") !== "nightDrawer", text: watchHint },
    { topics: ["loot", "treasure", "heirloom", "collection", "reliquary"], done: allTreasuresDeposited(ctx),
      text: "You've FOUND the loot — now actually PUT each heirloom in the RELIQUARY in the ROYAL HALL. They're worth nothing rattling around in your pockets." },
    { topics: ["finish", "ending", "escape", "bell", "reliquary"], done: false,
      text: "Everything's in the reliquary. CLOSE RELIQUARY, OPEN the BELL CLOSET beside the FRONT DOOR, then PULL the ROPE. And then — I mean this warmly — never call me again." },
  ];
}

// Returns the single most relevant next-step hint for the current game state.
function nextHint(ctx) {
  return hintEntries(ctx).find((hint) => !hint.done).text;
}

const HINT_QUERY_STOP_WORDS = new Set([
  "a", "about", "advice", "am", "an", "can", "clue", "do", "for", "help",
  "hint", "how", "i", "is", "me", "my", "next", "on", "please", "stuck",
  "tell", "the", "tip", "to", "what", "where", "with", "you",
]);

function hintForQuestion(ctx, question) {
  const tokens = [...new Set(String(question || "").toLowerCase()
    .match(/[a-z0-9]+/g) || [])]
    .map((token) => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token)
    .filter((token) => token.length > 1 && !HINT_QUERY_STOP_WORDS.has(token));
  if (!tokens.length) return nextHint(ctx);

  let best = null;
  let bestScore = 0;
  for (const hint of hintEntries(ctx)) {
    const topics = hint.topics.map((topic) => topic.toLowerCase());
    const text = hint.text.toLowerCase();
    const topicScore = tokens.reduce((score, token) =>
      score + (topics.some((topic) => topic === token) ? 3 : 0), 0);
    const textScore = tokens.reduce((score, token) =>
      score + (text.includes(token) ? 1 : 0), 0);
    const score = topicScore + textScore + (hint.done ? 0 : 0.25);
    if (score > bestScore) {
      best = hint;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best.text : nextHint(ctx);
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
  "*click* Blackwood Manor Hint Line, ninety-nine cents a minute, this is Gary. {{player_name}}, what.",
  "Yeah, {{player_name}} — Gary again. I can see it's the same number calling back, you know.",
  "*chewing* ...hrmf. Hint Line. Gary. Make it fast, {{player_name}}; my Hot Pocket's going cold.",
  "Oh good, {{player_name}}. My favorite caller. That was sarcasm. Whaddya want.",
  "Gary. {{player_name}}, I've been on this headset since noon and eaten one (1) vending-machine Danish.",
  "*muffled* — I'M ON A CALL, DENISE — ...yeah. Hint Line. Go ahead, {{player_name}}. Thrill me.",
  "*click* Gary speaking, {{player_name}}. Against my better judgment and the terms of my lunch break.",
  "Blackwood Manor Hint Line. {{player_name}}, you have questions; I have low blood sugar. Let's trade.",
  "Gary here. The headset is damp, the coffee is cold, and somehow {{player_name}} is still the emergency.",
  "*paper bag rustling* Hint Line. No, {{player_name}}, that wasn't food. It was the hope of food.",
  "You've reached Gary at Blackwood Manor support. Support is a generous word, {{player_name}}. Start talking.",
  "*click* Same haunted house, same underpaid man. What broke this time, {{player_name}}?",
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
  [500, "...that's five bucks, {{player_name}}. Five. On a hint line. In this economy."],
  [1000, "Ten dollars, {{player_name}}. TEN. You could've bought me lunch. SEVERAL lunches. But no."],
  [2000, "Twenty bucks — {{player_name}}, you're officially my biggest caller today. Congratulations, I guess."],
  [3500, "Thirty-five dollars. That's a whole hour of my wages, {{player_name}}, you magnificent disaster."],
  [5000, "Fifty. DOLLARS. {{player_name}}, you are the worst caller I have ever had. I'm weirdly proud. Now HANG UP."],
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
    "Blackwood Hint Line, Gary... oh. {{player_name}} again. You know you're the most human contact I get all shift? That's not a compliment. What.",
    "*sigh* Hint Line. Gary. Honestly, {{player_name}}? Kind of glad it's you. Don't read into that. Whaddya need.",
    "Gary here. Long night. Long life. ...anyway, {{player_name}}. The house. Right. Go ahead.",
    "Hint Line, Gary speaking. I recognized your ring, {{player_name}}. That's either sweet or a workplace injury.",
    "Oh, hey, {{player_name}}. You made it another few rooms. I mean— obviously you called for professional expertise. Proceed.",
    "*click* Gary. I was wondering if you'd call again, {{player_name}}. In a strictly billing-related way.",
    "Blackwood support. It's Gary. The night got quieter after you hung up, {{player_name}}, which was somehow worse.",
    "Gary here. I saved your place on the complaint form, {{player_name}}. And maybe in my thoughts. Forget that second part.",
    "{{player_name}} again. Good. I mean, fine. I mean the line is open. Talk.",
    "*chair squeaks* Hint Line. {{player_name}}, I was not asleep; I was resting my employment.",
    "Gary speaking. I made fresh coffee, {{player_name}}, and immediately regretted the word fresh.",
    "Hey, {{player_name}}. It's Gary. Let's deal with your haunted-house problem before either of us develops a new one.",
  ],
  [
    "Blackwood Cris— Hint Line. Gary. Sit down, {{player_name}}. Metaphorically. Tell me what's going on — with the house, and, y'know, in general.",
    "Gary. Deep breath, {{player_name}}. We'll get to the mansion. First: how are you carrying all this? ...Fine. What do you need.",
    "Hint Line, this is Gary, and I've been thinking a lot about us, {{player_name}}. Professionally. What's on your mind.",
    "Gary here. {{player_name}}, before we discuss doors, let's notice which ones you keep expecting to be locked.",
    "*click* Welcome back, {{player_name}}. Take one breath for the manor and one for whatever else followed you in.",
    "Blackwood Hint Line. Gary speaking. I have a pen now, {{player_name}}, so apparently this is becoming a practice.",
    "You reached Gary. Tell me where you're stuck, {{player_name}}, and try not to edit out how that feels.",
    "Gary here. No judgment, {{player_name}}, except about entering dark cellars without a lamp. Some judgment there.",
    "Hint Line. {{player_name}}, let's separate the immediate ghost problem from the larger pattern. Ghost first.",
    "*paper shuffles* I made notes about you, {{player_name}}. Mostly arrows and the word 'boundaries,' but they're notes.",
    "Gary speaking. Start with the room you're in, {{player_name}}. We can work outward from there.",
    "Welcome back, {{player_name}}. I can't fix the manor for you, but I can stay on the line while you name the next step.",
  ],
  [
    "Blackwood Manor Wellness Line, this is Gary, licensed by absolutely no one. Breathe with me, {{player_name}}. First — how are you, really?",
    "Gary. This is a safe space, {{player_name}}. Ninety-nine cents a minute, but safe. Tell me everything. Start with the house if it's easier.",
    "Welcome back, {{player_name}}. I kept your chart. *shuffles a napkin* Now — where were we with your fear of locked doors?",
    "Blackwood Wellness Line, Gary speaking. {{player_name}}, feet on the floor, unless you're wearing the winged shoes.",
    "Gary here. I lit a candle for your session, {{player_name}}. Human Resources says I absolutely did not.",
    "Welcome back, {{player_name}}. Your chart says 'resourceful, avoidant, carrying too many cursed objects.' Accurate?",
    "*calm inhale* This is Gary. {{player_name}}, name the room, name the feeling, then name the obvious exit.",
    "You've reached the wellness annex of the Hint Line, {{player_name}}, which is still just my cubicle with a fern.",
    "Gary speaking. Whatever the house is doing, {{player_name}}, you don't have to match its energy.",
    "Welcome, {{player_name}}. The meter is running, but we are not rushing. Those are different systems.",
    "Blackwood Wellness Line. {{player_name}}, let's approach the locked door with curiosity and, if available, the correct key.",
    "Gary here. I have your napkin-chart and a fresh pen, {{player_name}}. One of us is making progress.",
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
  return "\n\nOkay, {{player_name}}, you're properly lost, aren't you. Look — third shift, nothing to do, " +
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
    case 0: return "{{player_name}}, " + injectHunger(ctx, hint);
    case 1: return "{{player_name}}, " + hint + "\n\n(...sorry. Long night. Ignore me.)";
    case 2: return "Sure, {{player_name}}. The answer: " + hint +
      "\n\nBut notice you came to ME for it. What does needing help stir up in you? We can explore that.";
    default: return "Let's not rush to solutions, {{player_name}}... okay, okay: " + hint +
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
    return "{{player_name}}, oh my GOD — is that BARF I smell? You reek like a dumpster that ate a burrito and " +
      "regretted it, deeply. Please, for both our sakes, find a TOILET.\n\n";
  if ((ctx.getFlag("high") || 0) > 0)
    return "{{player_name}}... you're tripping balls right now, aren't you. I can hear it in your voice. Please " +
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

const GARY_GAME_COMMAND =
  /^(n|s|e|w|ne|nw|se|sw|u|d|g|t|o|c|l|ex|x|un|lk|z|up|down|in|out|go|walk|take|get|grab|open|close|look|examine|light|read|push|pull|unlock|lock|move|enter|climb|ring|put|drop|wear|attack|search|inventory|inv|i)\b/;

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
      "\"{{player_name}}, hey. I'm a made-up guy in a game about a haunted house, so I'm the wrong person " +
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
        ? "{{player_name}}, I hear you. And I'm setting a boundary: I'm ending our session. Sit with that. *click*"
        : "{{player_name}}, I don't get paid enough to be talked to like that. Figure it out yourself. *SLAM* *click*";
    }
    return say(ctx, [
      "{{player_name}}, wow. WOW. I'm a person — a hungry, underpaid person. One more crack like that and I hang up.",
      "Ouch, {{player_name}}. You know, that says more about you than me. One more and I'm gone.",
      "{{player_name}}, I hear anger. Anger's just fear in a leather jacket. But I have boundaries now — try that again.",
      "That lands as projection, {{player_name}}, and I forgive you. But let's not, okay? Let's not.",
    ]);
  }
  // MAP works on the line too — Gary told you to type it, so it had better work.
  // He reads his placemat sketch down the phone at you.
  if (/^(map|map mode|m)$/.test(t) || /\b(show|read|send|fax) (me )?(the )?map\b/.test(t)) {
    ctx.setFlag("usedMap", true);
    return say(ctx, [
      "Hang on, {{player_name}}, I've got it here somewhere... okay. Picture this. I'm holding up a placemat.",
      "*paper rustling* Right, {{player_name}}. This is the placemat. You can't see it, so I'll describe it. Slowly.",
      "Okay, {{player_name}}. Reading you my sketch. Don't judge the handwriting; I did this with a golf pencil.",
    ]) + "\n\n" + renderMap(ctx);
  }
  if (/\b(hint|help|stuck|clue|next|where|advice|tip)\b/.test(t) || /how (do|to|the heck|am i)/.test(t) || /what.*(do|now|next)/.test(t)) {
    ctx.addScore(-1);
    return frameHint(ctx, hintForQuestion(ctx, t)) + "\n\n" + meter(ctx) + billAside(ctx);
  }
  if (/\b(who|you gary)\b/.test(t) || /(your|whats|what'?s) name/.test(t)) {
    return say(ctx, [
      "Gary, {{player_name}}. I answer phones for a haunted house I've never set foot in and never will. That's the whole bio.",
      "Gary. Just Gary. Some nights that feels like a lot to carry, {{player_name}}.",
      "Gary, {{player_name}}. Hint-line operator, reluctantly. Listener, increasingly. It's a journey.",
      "Gary. Healer. Trapped man. Your name matters too, {{player_name}}. Names are part of the work.",
    ]);
  }
  if (/\b(pay|paid|wage|salary|money|rich|cost|charge|expensive|cheap|make|makes|earn|afford|worth)\b/.test(t)) {
    return say(ctx, [
      "Three thirty-five an hour, {{player_name}}. You pay ninety-nine cents a minute; I see none of it.",
      "Three thirty-five an hour, {{player_name}}. ...I've stopped doing the math. It doesn't help.",
      "Money, sure, {{player_name}}. But money's often how we dodge the harder conversation.",
      "Money's just how we postpone talking about feelings, {{player_name}}. Please — go on.",
    ]);
  }
  if (/\b(hung|hungry|food|eat|eating|lunch|dinner|hot\s*pocket|sandwich|pizza|snack|starv|meal)\b/.test(t)) {
    return say(ctx, [
      () => "{{player_name}}, " + cycleFlavor(ctx, "hunger") + " ...I'd trade this whole shift for a warm meal.",
      "Starving, {{player_name}}. Always. But lately I wonder if it's food I'm hungry for, or something... else.",
      "I used to be so hungry, {{player_name}}. Now I hunger for connection. And a sandwich.",
      "The hunger was never about the sandwich, {{player_name}}. ...It was. But also it wasn't.",
    ]);
  }
  if (/\b(manager|boss|supervisor|denise|fired|coworker)\b/.test(t)) {
    return say(ctx, [
      "{{player_name}}, my manager's also named Gary. Big Gary. We don't speak. Denise steals my chair.",
      "Big Gary and I have... history, {{player_name}}. Denise and I are working on it.",
      "Ah, {{player_name}}. Big Gary. Denise. My workplace is a rich text and I am, frankly, in therapy about it.",
      "Big Gary is my inner critic with a clipboard, {{player_name}}. Denise is my boundaries, personified.",
    ]);
  }
  if (/\b(feeling|alright)\b/.test(t) || /how are (you|things|ya)/.test(t) || /you (ok|okay|good)/.test(t) || /how.?s it going/.test(t)) {
    return say(ctx, [
      "How am I, {{player_name}}? It's dark, I'm starving, and you keep calling about a candle. Living the dream.",
      "How am I? ...Huh. Nobody asks, {{player_name}}. I'm tired. But this helps, weirdly.",
      "How am I? I'm processing, {{player_name}}. Genuinely. Now, how are YOU? Don't say 'fine.'",
      "How am I? Present. Grateful. Still underpaid. More importantly, {{player_name}}, how's your heart?",
    ]);
  }
  if (/\b(thank|thanks|thx|appreciate|please|sorry|nice|love you|good job|great|awesome|the best|proud)\b/.test(t)) {
    return say(ctx, [
      "...huh. Nobody says that to me, {{player_name}}. You're welcome. Don't make it weird.",
      "That actually got me, {{player_name}}. Thanks. Don't tell Denise I got misty.",
      "You're welcome, {{player_name}}. Notice how good it feels to express gratitude? That's the work.",
      "That means more than you know, {{player_name}}. This is growth. YOUR growth. Also mine.",
    ]);
  }
  if (GARY_GAME_COMMAND.test(t)) {
    return say(ctx, [
      "{{player_name}}, I'm a HINT LINE, not your legs. HANG UP and do it yourself, hotshot.",
      "I can't move you around, {{player_name}}. That part's on you. HANG UP and go.",
      "I can't walk it for you, {{player_name}} — and honestly, that's the point. HANG UP and take a step.",
      "I can't take that step for you, {{player_name}}. HANG UP. Walk your path. You've got this.",
    ]);
  }
  return say(ctx, [
    () => "{{player_name}}, " + cycleFlavor(ctx, "deflect") + " Say HINT for a real clue, or HANG UP.",
    "Not sure I follow, {{player_name}}, but I'm listening. Say HINT for a clue, or HANG UP.",
    "Sit with that a second, {{player_name}}. I don't fully get it, but I'm here.",
    "Mm, {{player_name}}. I'm present with that, even if I don't follow it. Say HINT for a real clue.",
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
  GARY_GAME_COMMAND,
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
      playerName: "{{player_name}}",
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
function readLetter(ctx) {
  const letter = ctx.item("letter");
  const points = awardProgress(ctx, "letterRead");
  return (letter?.text || "It's blank.") + awardSuffix(points);
}

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
  "pile of ash, a faintly scorched candle, and — somewhere, unanswered — a phone ringing off the hook.";
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
const MUSHROOM_REVELATIONS = [
  "...oh. OH. Colours have SOUNDS now. The wallpaper is humming directly into your teeth.",
  "The mushrooms arrive all at once. Every shadow acquires a personality and most seem supportive.",
  "A purple chord rings behind your eyes. The manor unfolds like a diagram drawn by an anxious wizard.",
  "The floor exhales beneath you, the ceiling leans closer, and perspective becomes an optional courtesy.",
  "Your thoughts grow feathers. Gravity looks embarrassed to have taken itself so seriously.",
  "The room separates into light, sound, and several new categories for which language has not prepared you.",
  "Every edge glows with private meaning. Even the dust seems to know where it is going.",
  "The mushrooms kick open a door behind your forehead and leave the hinges spinning.",
  "Colour pours through the silence. For one lucid second, the entire house makes terrible sense.",
  "Your pulse becomes visible, your shadow becomes opinionated, and the walls begin breathing in rounds.",
  "A warm violet buzz climbs your spine. Reality loosens its collar and stops enforcing the dress code.",
  "The manor turns translucent around you, less a building now than a nervous system with wallpaper.",
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
const ALL_DIGESTIVE_PHASES = (1 << DIGESTIVE_PHASES.length) - 1;
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
  const points = awardProgress(ctx, "mushroomVisionOpened");
  const origin = mushrooms?.fresh
    ? "You eat the fresh mushrooms. They are slick with literal crap and piss from the TOILET HOLE — " +
      "not metaphorical filth, not spooky swamp water: actual human waste. You swallow anyway."
    : "You chew through the dried kitchen mushrooms. They are dusty and bitter, but the trip hits just the same.";
  return origin + "\n\n" + cycleFlavor(ctx, "mushroomRevelations") + "\n\n" +
    "The house isn't haunted, man — it's just misunderstood. You feel amazing, invincible, and deeply unqualified to be here. " +
    "Your body feels so light you could FLY TO any room you can name.\n\n" +
    "Something else opens too: between your brows, an astral eye blinks awake. The dark of the house turns " +
    "to legible grey, and in your mind's eye a SECRET DOOR blooms in the ATTIC's north gable, behind it " +
    "something that wants to be found.\n\n(Your THIRD EYE is open: you can see in the dark, and hidden " +
    "detail keeps revealing itself while the trip lasts.)" + awardSuffix(points);
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
  ctx.setFlag("burritoPhasesSeen", 0);
  ctx.setFlag("burritoCourseActive", true);
  ctx.setFlag("fartIgnitionQueued", false);
  ctx.setFlag("ateBurrito", true); // permanent: the digestive pilot light never fully goes out (Andy's rule)
  ctx.setFlag("ateSuperBurrito", true);
  return "You eat Gary's Mega Ass Blow Taqueria Death Wish Spicy Burrito.\n\nFor one calm moment, nothing happens. " +
    "Then your abdomen makes a noise like a boiler falling down stairs. You retain the crumpled wrapper and its tin " +
    "foil, mostly because your hands have forgotten how to let go. (Find the TOILET or drink the MILK before " +
    "this completes ten full digestive laps.)";
}

function surviveBurrito(ctx, wasSick) {
  const completedCourse = ctx.getFlag("burritoCourseActive")
    && ((ctx.getFlag("burritoPhasesSeen") || 0) & ALL_DIGESTIVE_PHASES) === ALL_DIGESTIVE_PHASES;
  ctx.setFlag("burritoCourseActive", false);
  if (!wasSick || !ctx.getFlag("ateSuperBurrito") || !completedCourse) return "";
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
  const candelabra = ctx.item("candelabra");
  const hasLitCandelabra = candelabra?.loc === "inventory" && candelabra.lit;
  if (!ctx.getFlag("onFire") && !hasLitCandle && !hasLitCandelabra) {
    return "The moss is grave-damp and the kindling packed tight. A lone MATCH flares too briefly; you need a " +
      "carried LIT CANDLE, the restored CANDELABRA, or a far bigger, more reckless flame.";
  }
  ctx.setFlag("brazierLit", true);
  const usedBodyFire = ctx.getFlag("onFire");
  const points = usedBodyFire ? STANDALONE_MAX_AWARDS.brazier : 10;
  ctx.addScore(points);
  ctx.moveItem("emberStone", "garden");
  if (hasLitCandelabra && !usedBodyFire) {
    ctx.setFlag("brazierMethod", "candelabra");
    return "You touch one of the CANDELABRA'S steady blue-white flames to the grave-damp moss. Fire races around " +
      "the bowl in a single bright circle, and the BRAZIER roars up in gold and green.\n\n" +
      `In the light, something green glints in the ash at its foot: an EMERALD GEM. (+${points})`;
  }
  if (hasLitCandle && !usedBodyFire) {
    ctx.setFlag("brazierMethod", "candle");
    return "You press the LIT CANDLE to one sodden knot of moss after another, patiently building heat " +
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
  greenGlassStone: { label: "RUBY GEM", slot: "top" },
  blueGlassStone: { label: "SAPPHIRE GEM", slot: "bottom" },
});
const OAK_SLOT_ORDER = Object.freeze(["bottom", "middle", "top"]);
const OAK_LEGACY_COLOR_GEMS = Object.freeze({
  red: "greenGlassStone",
  green: "emberStone",
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
  if (["all", "everything"].includes(cmd.dobj)) return null;
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
    if (ctx.getFlag("burritoCourseActive")) {
      ctx.setFlag("burritoPhasesSeen", (ctx.getFlag("burritoPhasesSeen") || 0) | (1 << phase));
    }
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
  "A desk chair scrapes below. Someone has stood up very quickly.",
  "A bare bulb clicks on beneath the floor and throws a thin blade of light up the open stair.",
  "The open stair breathes up a smell of stale coffee, mushrooms, and cold burrito.",
  "From below comes one startled laugh, cut short as if its owner cannot quite believe his luck.",
  "A drawer slams beneath the floor. Hurried footsteps cross the little room below.",
  "The ROTARY PHONE below gives a single loose clatter in its cradle, then remains silent.",
  "Someone beneath the house whispers, \"The clock,\" with breathless excitement.",
  "The floor trembles around the stair. A man below whispers your name: \"{{player_name}}.\"",
  "A desk chair scrapes below. Footsteps approach the bottom of the stair, stop, and retreat.",
  "The smell of old burrito, damp mushrooms, and hot plastic rolls up from the darkness.",
  "A man beneath the house says, very softly, \"You actually did it.\"",
  "Weak electric light glows below while someone paces beside a silent phone.",
];
const FORESHADOW_MID = [
  "Far off — below you, impossibly — a telephone cord drags across a desk, then stops.",
  "A voice rehearses somewhere under the house. You catch one word: \"...{{player_name}}...\" Then nothing.",
  "Faint BELLS, and beneath them a scritch-scratch, like a pen writing very fast.",
  "Under the floor, a receiver shifts in its cradle. A man mutters, \"Not yet.\"",
  "A distant voice says, \"The bell first,\" as if practicing what to tell you.",
  "The stone beneath you vibrates with the thin electrical hum of a silent phone.",
  "Somewhere below, a drawer slams and a hungry voice accuses someone named Denise.",
  "Three soft taps travel up through the walls. A chair scrapes in answer.",
  "A scratchy voice rehearses your name beneath the floor, then coughs and starts over.",
  "Warm dust rises from a seam in the flagstones, carrying the smell of burnt coffee.",
  "A tiny bell jingles below, followed by furious scribbling and the click of a pen.",
  "You catch a muffled fragment through the stone: \"...when {{player_name}} rings it...\"",
];
const FORESHADOW_EARLY = [
  "Somewhere in the walls: a dry scritch-scratch, there and gone.",
  "A tiny, far-off click, like a phone settling deeper into its cradle.",
  "A cold draught carries the ghost of a voice, too faint to make out.",
  "A floorboard behind you creaks under a weight that is not there.",
  "Something taps twice inside the wall, pauses, then seems to write the answer down.",
  "The pipes carry a single voice rehearsing something from impossibly far away.",
  "A bell gives one soft, uncertain note somewhere deeper in the house.",
  "For a moment, the silence has the papery texture of someone turning a page.",
  "A faint electrical hum passes beneath your feet and vanishes into the stone.",
  "You hear a receiver creak in its cradle in a room that cannot be nearby.",
  "The wall exhales stale coffee and dust, then becomes only a wall again.",
  "Somewhere below, a chair squeaks and a tired man whispers, \"{{player_name}}.\"",
];

// Ambient foreshadowing for the Gary ending intensifies as the reliquary fills.
// Once the clock opens the stair, Gary is waiting below beside a silent phone.
// Gated behind the same chaos kill-switch as lightning, and
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
  "     \"FREEDOM!\"  CLANG",
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
      && ctx.world.rooms[id].phase !== 2 // Part II hours are reachable only via the clock
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
const PACKAGE_OPENINGS = [
  "Against every instinct, and the express written warning on the card, you tear the ribbon and lift the lid.",
  "You reread the warning, misunderstand its purpose completely, and pull the ribbon loose.",
  "The card says not to. The house feels like it agrees. You open the PACKAGE anyway.",
  "You test the bow, find it offensively well tied, and dismantle it with mounting personal commitment.",
  "Common sense files a formal objection. You overrule it and raise the lid.",
  "You give the PACKAGE one final chance to explain itself, then tear through the paper.",
  "The ribbon slips free with suspicious ease. You open the box before prudence can catch up.",
  "You decide the warning is probably decorative and lift the lid with both hands.",
  "Every survival instinct points away from the PACKAGE. Your hands vote differently.",
  "You peel back the wrapping one careful inch at a time, as if caution still matters at this point.",
  "The box waits. You sigh, loosen the bow, and make the exact mistake requested of you.",
  "You whisper, \"This is a bad idea,\" which apparently counts as consent, and open the PACKAGE.",
];
function openMysteryPackage(ctx) {
  ctx.destroy("mysteryPackage");
  const effect = PACKAGE_EFFECTS[Math.floor(Math.random() * PACKAGE_EFFECTS.length)];
  return cycleFlavor(ctx, "packageOpenings") + "\n\n" + effect(ctx);
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
const LIGHTNING_INVITATIONS = [
  "A jagged bolt has speared into the floor where you stand, hissing and crackling. You could TOUCH it, if you dare.",
  "The blue-white bolt remains planted in the boards like a live wire. TOUCH it if bad judgment feels urgent.",
  "LIGHTNING writhes in the floor and waits for a volunteer. You may TOUCH it before it vanishes.",
  "The bolt snaps at the air but does not move toward you. If this becomes a mistake, it begins with TOUCH.",
  "A fork of raw LIGHTNING hums at your feet. Nothing requires you to TOUCH it, which has rarely stopped you.",
  "The crackling bolt holds its place for one impossible moment. TOUCH it now or let it burn itself out.",
  "Blue fire crawls along the floorboards around the embedded bolt. You could TOUCH the center and see what happens.",
  "The room smells of rain and hot metal. The LIGHTNING waits below your hand if you choose to TOUCH it.",
  "The bolt trembles like a doorway made of voltage. TOUCH it to step through whatever comes next.",
  "A white-hot seam of LIGHTNING pulses in the floor. It looks extremely touchable in the worst possible way: TOUCH it.",
  "Static lifts every hair on your arms while the bolt waits. One TOUCH would settle the question badly.",
  "The LIGHTNING has arrived, stayed, and offered no instructions. TOUCH it before it sputters out, or exercise restraint.",
];
const LIGHTNING_ART = [
  "            ⚡",
  "           ╱",
  "          ╱___",
  "              ╲",
  "           ____╲",
  "          ╱",
  "         ╱",
  "        ⚡",
].join("\n");
function lightningTick(ctx) {
  if (ctx.getFlag("__noChaos")) return null; // deterministic test harness kill-switch
  if (ctx.getFlag("partII")) return null; // Part II (the ghost loop) plays by its own rules — no manor lightning
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
    cycleFlavor(ctx, "lightningInvitations");
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
      "bed of literal crap and piss. They glow twice as brightly as the dried kitchen ones.";
  }
  if (mushrooms && mushrooms.loc === "privy") {
    return "Inside the TOILET HOLE, the fresh MUSHROOMS remain rooted in literal crap and piss.";
  }
  if (mushrooms && mushrooms.loc === "inventory") {
    return "The TOILET HOLE sits empty — you already pulled this crop free.";
  }
  return "You look into the TOILET HOLE. Only crap, piss, and the torn roots of the last crop remain. The " +
    "muck looks fertile enough that another might push through, given time.";
}
function takeToiletMushrooms(ctx) {
  if (!ctx.getFlag("outhouseMushroomsFound")) {
    return "You stop before reaching blindly into the dark hole. You should LOOK IN THE TOILET first.";
  }
  const mushrooms = ctx.item("outhouseMushrooms");
  if (!mushrooms || mushrooms.loc !== "privy") return "There's nothing to pull free right now — just crap and piss.";
  if (ctx.has("outhouseMushrooms")) return "You already have the fresh mushrooms.";
  if (ctx.inventoryLoad() >= ctx.inventoryCapacity())
    return "Your hands are full. You'll have to drop something before reaching into that.";
  ctx.moveItem("outhouseMushrooms", "inventory");
  return "You reach into the TOILET HOLE and pull the MUSHROOMS free. Your hand comes back coated in literal " +
    "crap and piss. The mushrooms are not cleaner.";
}
function reachIntoToilet(ctx, cmd) {
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  if (!/\b(toilet|hole|mushroom|fungus)\b/.test(target)) return null;
  return takeToiletMushrooms(ctx);
}
function deriveCommand(ctx, cmd) {
  if (cmd.verb === "show" && cmd.dobj && !cmd.iobj && ctx.has("backwardsWatch")) {
    const destination = resolveWatchRoom(ctx, cmd.dobj);
    if (destination?.[0] === ctx.state.room) {
      cmd.verb = "look";
      cmd.dobj = null;
      cmd.prep = null;
      cmd.iobj = null;
      return [];
    }
    if (destination) {
      cmd.prep = "in";
      cmd.iobj = "woodblack";
      return [`show ${cmd.dobj} in woodblack`];
    }
  }
  if (cmd.verb === "route" && cmd.dobj && !cmd.iobj && ctx.has("backwardsWatch")) {
    cmd.prep = "with";
    cmd.iobj = "woodblack";
    return [`route ${cmd.dobj} with woodblack`];
  }
  if (ctx.state.room !== "privy" || ctx.getFlag("outhouseMushroomsFound")) return [];
  if (!["take", "eat", "reach", "use"].includes(cmd.verb)) return [];
  const target = `${cmd.dobj || ""} ${cmd.iobj || ""}`.toLowerCase();
  const mushroomTarget = /\b(mushroom|mushrooms|fungus)\b/.test(target) || target.trim() === "fresh";
  if (!mushroomTarget && !/\b(toilet|hole)\b/.test(target)) return [];
  if (cmd.verb === "use" && !mushroomTarget) return [];
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

const TROLL_RHYMES = new Set(["lore"]);
const TROLL_REJECTED_RHYMES = new Set([
  "adore", "before", "boar", "bore", "chore", "core", "door", "explore",
  "floor", "fore", "four", "gore",
  "ignore", "oar", "or", "pore", "poor", "pour", "score", "snore",
  "more", "roar", "shore", "sore", "store", "therefore", "tore", "war", "wore", "yore",
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
  mushroomRevelations: MUSHROOM_REVELATIONS,
  sickBurp: SICK_BURP_LINES,
  sickBarf: SICK_BARF_LINES,
  sickFart: SICK_FART_LINES,
  sickPoop: SICK_POOP_LINES,
  foreshadowEarly: FORESHADOW_EARLY,
  foreshadowMid: FORESHADOW_MID,
  foreshadowOpen: FORESHADOW_OPEN,
  lightning: LIGHTNING_FLAVORS,
  lightningInvitations: LIGHTNING_INVITATIONS,
  packageOpenings: PACKAGE_OPENINGS,
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
  const raw = (cmd.dobj || cmd.iobj || "").replace(/^['"`]+|['"`]+$/g, "");
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
      return `(talk to CAVE TROLL)\n\n${talkToTroll(ctx)}`;
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
  else if (ctx.getFlag("brazierMethod") === "candelabra")
    b.push("🕯️ BADGE: \"Remembered Flame\" — the restored Blackwood candelabra kindled the ceremonial brazier.");
  else if (ctx.getFlag("brazierMethod") === "candle")
    b.push("🕯️ BADGE: \"Patient Flame\" — you coaxed the ceremonial brazier alight with the candle.");
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
    "   FRONT      ______",
    "   DOOR      /      \\",
    "    ||      |  RQ    |",
    "    || [CL] | [||||] |",
    "    ||______|________|",
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
  betweenWalls: [
    "||   ?    ?   ||",
    "||  /|   /|   ||",
    "|| / |  / |   ||",
    "||_______watch||",
  ].join("\n"),
};

const IMPLICIT_NAVIGATION = Object.freeze({
  p2_awakening: { in: "use clock", out: "use clock" },
  t13_medusaGarden: { in: "use clock", out: "use clock" },
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
  grandHall: { in: null, out: "south" },
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
  garysLair: { in: "down", out: "up" },
  betweenWalls: { in: null, out: "out" },
});

// ---- the world ---------------------------------------------------------------
const logicWorld = {
  config: {
    start: "gate",
    maxCarry: 6,
    title: "Blackwood Manor",
    playerNamePrompt:
      'What should we call you?\n\nType your name, SAY "Jeb", or CALL ME "Foo".',
    playerNameAccepted:
      "Good. We will call you {{player_name}}.\n\nThe last daylight is draining from the sky.",
    defaultPlayerNameParts: {
      titles: [
        "Professor", "Doctor", "Madame", "Mister", "Dean", "Chancellor",
        "Reverend", "Captain", "Baron", "Dame", "Sir", "Inspector",
      ],
      moods: [
        "Spooky", "Craptastic", "Farty", "Poopy", "Stinkbomb", "Buttcheek",
        "Booger", "Wobblegut", "Dingleberry", "Snotrocket", "Burptastic", "Gassy",
      ],
      garments: [
        "McPoopypants", "Elastic", "Poopaloons", "Fartbritches", "Butttrousers", "Stinkpants",
        "Crapbreeches", "Snotshorts", "Wobblepants", "Doodoodrawers", "Burpbloomers", "Tootleggings",
      ],
    },
    defaultPlayerNameAccepted:
      "No name? Fine. We will call you {{player_name}}. Change it anytime with CALL ME FOO.\n\n" +
      "The last daylight is draining from the sky.",
    playerNameChanged: "Done. We will call you {{player_name}}.",
    shortPlayerNameJoke:
      "Okay! I'll call you {{funny_name}}... just kidding, I'll call you {{player_name}} from now on.",
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
  reliquaryStatusValue, // HUD-compatible RELIQUARY count text
  routeWithMirror: routeWithWoodblackWatch,
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
  afterPlayerNamed,
  migrateState(state, { savedItems }) {
    if (!state.flags.playerName && state.flags.ghostName) {
      state.flags.playerName = state.flags.ghostName;
    }
    delete state.flags.ghostName;
    if (state.flags.partII) state.flags.bellRung = true;
    if (state.room === "hollowPassage" || state.room === "hollowSanctum") {
      state.room = "grandHall";
    }
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
    const completedBeforeHammer = state.flags.curseLiftable
      || state.flags.floorDoorOpen
      || state.flags.bellRung
      || state.won;
    const oldMirror = savedItems?.batSightMirror?.treasure
      ? savedItems.batSightMirror
      : null;
    const oldWatch = savedItems?.backwardsWatch;
    const oldWatchWasHeirloom = !!oldWatch?.treasure;
    const oldCandlestick = savedItems?.candlestick;
    const oldCandlestickWasHeirloom = !!oldCandlestick?.treasure;
    const needsHeirloomRedesign = !!oldMirror || oldWatchWasHeirloom || oldCandlestickWasHeirloom;

    if (needsHeirloomRedesign) {
      const oldGoggles = savedItems?.xrayGoggles;
      const oldGogglesLocation = oldGoggles?.loc;
      const oldGogglesWereMoved = oldGogglesLocation != null && oldGogglesLocation !== "nightDrawer";
      const oldMirrorLocation = oldMirror?.loc;
      const oldMirrorWasDeposited = ["reliquary", "clockTalisman"].includes(oldMirrorLocation);
      const gogglesLocation = oldMirrorWasDeposited
        ? oldMirrorLocation
        : oldMirrorLocation === "inventory"
          ? "inventory"
          : oldGogglesWereMoved
            ? oldGogglesLocation
            : oldMirrorLocation === "belfry" || state.flags.belfryBatsScattered
              ? "belfry"
              : null;
      state.items.xrayGoggles.loc = gogglesLocation;
      state.items.xrayGoggles.worn = gogglesLocation === "inventory" && !!oldGoggles?.worn;
      state.items.backwardsWatch.loc = oldGogglesLocation == null ? "nightDrawer" : oldGogglesLocation;
      state.items.backwardsWatch.worn =
        state.items.backwardsWatch.loc === "inventory" && !!oldGoggles?.worn;

      const mirrorClaimed = !!oldMirrorLocation && oldMirrorLocation !== "belfry";
      if (mirrorClaimed) state.flags["progressItem:xrayGoggles"] = true;
      if (state.flags["heirloomScore:batSightMirror"]
          || oldMirrorWasDeposited || state.flags.heirloomsTransformed) {
        state.flags["heirloomScore:xrayGoggles"] = true;
      }

      const oldWatchLocation = oldWatch?.loc;
      const oldWatchWasClaimed = !!oldWatchLocation && oldWatchLocation !== "betweenWalls";
      const hammerLocation = !oldWatchWasHeirloom && completedBeforeHammer
        ? (state.flags.heirloomsTransformed ? "clockTalisman" : "reliquary")
        : (oldWatchLocation ?? "betweenWalls");
      state.items.blackwoodHammer.loc = hammerLocation;
      if (state.flags["heirloomScore:backwardsWatch"]
          || ["reliquary", "clockTalisman"].includes(hammerLocation)
          || (!oldWatchWasHeirloom && oldWatchWasClaimed)
          || state.flags.heirloomsTransformed) {
        state.flags["heirloomScore:blackwoodHammer"] = true;
      }
      if (!oldWatchWasHeirloom && completedBeforeHammer && !oldWatchWasClaimed) {
        state.score = (state.score || 0) + (world.items.blackwoodHammer.points || 0);
      }

      const oldCandlestickLocation = oldCandlestick?.loc;
      const restoredCandelabra = oldCandlestickWasHeirloom
        && (["reliquary", "clockTalisman"].includes(oldCandlestickLocation)
          || state.flags.heirloomsTransformed);
      if (restoredCandelabra) {
        state.items.candlestick.loc = null;
        state.items.mirrorShard.loc = null;
        state.items.candelabraFrame.loc = null;
        state.items.candelabra.loc =
          oldCandlestickLocation === "clockTalisman" || state.flags.heirloomsTransformed
            ? "clockTalisman"
            : "reliquary";
        state.flags.candelabraCandleInstalled = true;
        state.flags.candelabraShardInstalled = true;
        state.flags.candelabraRestored = true;
      } else if (oldCandlestickWasHeirloom && state.items.candlestick.loc == null) {
        state.items.candlestick.loc = "diningRoom";
      }
      if (state.flags["heirloomScore:candlestick"]
          || restoredCandelabra || state.flags.heirloomsTransformed) {
        state.flags["heirloomScore:candelabra"] = true;
      }
      state.flags.heirloomRedesignMigrated = true;
    }
    if (state.flags["progressAward:belfryMirrorFreed"]
        && !state.flags["progressAward:belfryGogglesFreed"]) {
      state.flags["progressAward:belfryGogglesFreed"] = true;
    }
    if (state.flags.candelabraRestored || state.items.candelabra.loc !== null) {
      state.items.candelabra.lit = true;
    }
    const collectionComplete = Object.entries(world.items)
      .filter(([, definition]) => definition.treasure)
      .every(([id]) => state.items[id]?.loc === "reliquary");
    if (collectionComplete) {
      state.flags.curseLiftable = true;
      if (!state.flags.bellRung) state.flags.floorDoorOpen = false;
    }
    for (const [id, definition] of Object.entries(world.items)) {
      if (!definition.treasure) continue;
      if (["reliquary", "clockTalisman"].includes(state.items[id]?.loc)
          || state.flags.heirloomsTransformed) {
        state.flags[definition.depositScoreFlag || `heirloomScore:${id}`] = true;
      }
    }
    if (state.flags.bellRung && !state.flags.heirloomsTransformed) {
      for (const [id, definition] of Object.entries(world.items)) {
        if (definition.treasure) state.items[id].loc = "clockTalisman";
      }
      state.items.clockTalisman.loc = state.flags.partII ? "inventory" : "reliquary";
      state.flags.heirloomsTransformed = true;
      state.flags.frontDoorOpen = true;
      state.items.frontDoor.locked = false;
      state.items.frontDoor.open = true;
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
      belfryGogglesFreed: state.flags.belfryBatsScattered,
      mushroomVisionOpened: state.flags.vaultFound,
      atticLadderLowered: state.flags.ladderDown,
      reliquarySealed: state.flags.curseLiftable && state.flags.reliquarySealed,
      bellRung: state.flags.bellRung,
      burritoSurvived: (state.flags.ateSuperBurrito
          || (state.flags.ateBurrito && state.items.burrito?.loc == null))
        && !(state.flags.sick > 0) && !state.dead
        && ((state.flags.burritoPhasesSeen || 0) & ALL_DIGESTIVE_PHASES) === ALL_DIGESTIVE_PHASES,
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
      art: ROOM_ART.gate,
      exits: { north: "porch", east: "garden", west: "hedgeMazeGate" },
    },

    garden: {
      art: ROOM_ART.garden,
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
        art: [
          "  ||||||     ||||||",
          "  ||  \\       /  ||",
          "  ||   \\_____/   ||",
          "  ||             ||",
        ].join("\n"),
        exits: { east: "gate", west: "hedgeMazeKnot", south: "hedgeMazeLoop" },
      },

    hedgeMazeKnot: {
        art: [
          "  >>>>\\     /<<<<",
          "  >>>> \\___/ <<<<",
          "       /   \\",
          "  <<<< /     \\ >>>>",
        ].join("\n"),
        exits: { east: "hedgeMazeGate", west: "hedgeMazeLoop", south: "dragonCaveMouth" },
      },

    hedgeMazeLoop: {
        art: [
          "  /\\/\\/\\/\\/\\/\\",
          "  \\          /",
          "   \\  LOOP  /",
          "    \\/\\/\\/\\/",
        ].join("\n"),
        exits: { north: "hedgeMazeLoop", east: "hedgeMazeKnot", west: "hedgeMazeGate" },
      },

    dragonCaveMouth: {
        art: [
          "       /\\___/\\",
          "   ___/  -.-  \\___",
          "  /____ DREADMAW ___\\",
          "      \\________/",
        ].join("\n"),
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
        art: [
          "  |\\            /|",
          "  | \\  rails   / |",
          "  |  \\=====>  /  |",
          "  |___\\______/___|",
        ].join("\n"),
        exits: { west: "dragonCaveMouth", east: "mineGallery" },
      },

    mineGallery: {
      art: [
        "  |--|--|--|--|",
        "  |  o==>      |",
        "  |_/|\\________|",
        "    / \\  rails",
      ].join("\n"),
      exits: { west: "dragonAntechamber", down: "deepShaft" },
    },

    deepShaft: {
      art: [
        "  |\\          /|",
        "  | \\   ||   / |",
        "  |  \\  ||  /  |",
        "  |___\\_||_/___|",
      ].join("\n"),
      dark: true,
      exits: { up: "mineGallery", east: "trollGate" },
    },

    trollGate: {
      art: [
        "  |\\    TROLL   /|",
        "  | \\  .-^^-.  / |",
        "  |  \\[ DOOR ]/  |",
        "  |___\\______/___|",
      ].join("\n"),
      exits: {
        west: "deepShaft",
        east: { to: "dreadmawVault", via: "dragonVaultOpen",
          lockedMsg: "The inner VAULT DOOR remains sealed behind the TROLL." },
      },
      on: { say: answerTrollRiddle },
    },

    dreadmawVault: {
        aliases: ["dreadmaw vault", "dragon hoard", "cave of riches", "hoard"],
        art: [
          "   $  *  $  *  $",
          "  /_____________\\",
          " /_$$_GEMS_$$_*__\\",
          " \\_______________/",
        ].join("\n"),
        exits: { west: "trollGate" },
      },

    privy: {
      art: ROOM_ART.privy,
      exits: { west: "garden", east: "greatOak" },
      on: { reach: reachIntoToilet },
    },

    greatOak: {
      aliases: ["great oak", "oak tree", "oak"],
      art: [
        "       /\\  /\\",
        "    __/  \\/  \\__",
        "      ||     ||",
        "      ||     ||",
        "     /_______\\",
      ].join("\n"),
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
      aliases: ["tree fort", "treehouse", "tree house"],
      art: [
        "      __________",
        "     /  FORT   /|",
        "    /________/  |",
        "    | [___]  |  |",
        "    |___||___|__|",
      ].join("\n"),
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
      art: ROOM_ART.porch,
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
      on: {
        go(ctx, cmd) {
          if (!ctx.getFlag("partII") && ctx.getFlag("bellRung")
              && (cmd.dobj === "south" || cmd.dobj === "out")) {
            return leaveThroughFrontDoor(ctx);
          }
          return null;
        },
      },
    },

    grandHall: {
      art: ROOM_ART.grandHall,
      searchDesc(ctx) {
        if (ctx.getFlag("bellRung")) {
          return ctx.has("clockTalisman")
            ? "The FRONT DOOR stands wide open, and the floor TRAPDOOR exposes a narrow STAIRCASE DOWN."
            : "The FRONT DOOR stands wide open. The floor TRAPDOOR is open, and the RELIQUARY no longer holds " +
                "thirteen separate heirlooms.";
        }
        if (ctx.getFlag("curseLiftable")) {
          return "All thirteen fitted recesses in the RELIQUARY are filled. CLOSE its glass doors, OPEN the " +
            "BELL CLOSET beside the FRONT DOOR, and PULL the ROPE.";
        }
        return `The RELIQUARY contains ${REQUIRED_FAMILY_ITEM_COUNT} heirloom-shaped recesses. Beside the FRONT ` +
          "DOOR, a narrow BELL CLOSET waits behind a wooden door.";
      },
      extraDirections: (ctx) => ctx.getFlag("floorDoorOpen") ? ["down"] : [],
      exits: {
        south: "porch", east: "parlor", west: "diningRoom", up: "landing",
      },
      on: {
        take(ctx, cmd) {
          const contents = nestedContents(ctx, "reliquary");
          const it = cmd.itemId
            ? contents.find((item) => item.id === cmd.itemId)
            : ctx.find(cmd.dobj, contents);
          if (!it) return null;
          if (!ctx.item("reliquary").open) return "The RELIQUARY'S glass doors are closed.";
          if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
            return "Your hands are full. You'll have to drop something before retrieving it.";
          }
          const wasContributing = it.treasure && ctx.roomOf(it.id) === "reliquary";
          ctx.moveItem(it.id, "inventory");
          if (wasContributing) ctx.setFlag("curseLiftable", false);
          return `You take the ${it.names[0]} from the RELIQUARY.` +
            (cmd.bulkTransfer ? "" : `\n\n${reliquaryCountLine(ctx)}`);
        },
        // Deposit heirlooms into the reliquary (scoring the deposit).
        put(ctx, cmd) {
          if (!cmd.iobj) return null;
          const dest = ctx.find(cmd.iobj);
          if (!dest || dest.id !== "reliquary") return null; // let generic put handle other containers
          if (!dest.open) return "The RELIQUARY'S glass doors are closed.";
          if (["all", "everything"].includes(cmd.dobj)) return null;
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
            const scoreFlag = it.depositScoreFlag || `heirloomScore:${it.id}`;
            if (!ctx.getFlag(scoreFlag)) {
              ctx.addScore(it.points || 0);
              ctx.setFlag(scoreFlag);
            }
          }
          let msg = `You place the ${it.names[0]} in its fitted recess in the RELIQUARY.`;
          if (!cmd.bulkTransfer) msg += `\n\n${reliquaryCountLine(ctx)}`;
          if (allTreasuresDeposited(ctx) && !alreadyLiftable) {
            ctx.setFlag("curseLiftable");
            msg += "\n\nAll thirteen heirlooms are in place. CLOSE the RELIQUARY, OPEN the BELL CLOSET beside " +
              "the FRONT DOOR, then PULL the ROPE.";
          }
          return msg;
        },
        pull(ctx, cmd) {
          if (!/\b(bell|rope|cord)\b/i.test(cmd.dobj || "")) return null;
          if (!ctx.item("bellCloset").open) {
            return "The lower BELL ROPE is inside the narrow CLOSET beside the FRONT DOOR. OPEN the CLOSET first.";
          }
          return pullClosetBellRope(ctx);
        },
        go(ctx, cmd) {
          if (!ctx.getFlag("partII") && ctx.getFlag("bellRung") && cmd.dobj === "south") {
            return leaveThroughFrontDoor(ctx);
          }
          if (cmd.dobj !== "down") return null;
          if (!ctx.getFlag("bellRung")) return "There is no stair DOWN.";
          if (!ctx.has("clockTalisman")) {
            return "The floor TRAPDOOR stands open, but whatever replaced the heirlooms pulls you back toward " +
              "the RELIQUARY. EXAMINE it and take it before descending.";
          }
          if (!ctx.getFlag("floorDoorOpen")) return "The COUNTDOWN CLOCK ticks, but the floor remains shut.";
          ctx.state.room = "garysLair";
          return garyEnding(ctx);
        },
        ring(ctx, cmd) {
          if (!/\b(bell|rope|cord)\b/i.test(cmd.dobj || "")) return null;
          return "The great BELL is up in the BELFRY. Its lower ROPE is hidden in the CLOSET beside the FRONT DOOR.";
        },
      },
    },

    parlor: {
      art: ROOM_ART.parlor,
      searchDesc(ctx) {
        return ctx.getFlag("safeRevealed")
          ? "Behind the swung-aside PROFILE PAINTING, the iron SAFE's combination dial shows recent fingerprints."
          : "The PROFILE PAINTING frame stands proud of the wall. One side has hinges; the other has fingerprints where a hand might push.";
      },
      exits: { west: "grandHall", south: "library" },
      on: { code: enterSafeCode },
    },

    library: {
      art: ROOM_ART.library,
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
      art: ROOM_ART.secretChamber,
      dark: true,
      exits: { up: "library" },
    },

    diningRoom: {
      art: ROOM_ART.diningRoom,
      searchDesc: diningRoomSearch,
      exits: { east: "grandHall", south: "kitchen" },
    },

    kitchen: {
      art: ROOM_ART.kitchen,
      exits: {
        north: "diningRoom",
        down: { to: "wineCellar", via: "cellarOpen", lockedMsg: "The cellar door is shut." },
      },
    },

    wineCellar: {
      art: ROOM_ART.wineCellar,
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
      art: ROOM_ART.crypt,
      dark: true,
      exits: { north: "wineCellar" },
    },

    landing: {
      art: ROOM_ART.landing,
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
      art: ROOM_ART.nursery,
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
      art: ROOM_ART.masterBedroom,
      exits: { west: "landing" },
    },

    study: {
      art: ROOM_ART.study,
      exits: { north: "landing" },
    },

    hallBedroom: {
      art: [
        "  .--------------.",
        "  | BED    ( / ) |",
        "  |        [_]   |",
        "  '----DOOR------'",
      ].join("\n"),
      searchDesc: hallBedroomSearch,
      exits: { south: "landing" },
    },

    attic: {
      art: ROOM_ART.attic,
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
      aliases: ["roof"],
      art: [
        "       /\\       |^|",
        "  ____/  \\______| |",
        " /_______________\\|",
        "      ROOFLINE",
      ].join("\n"),
      exits: { down: "attic", east: "belfry" },
    },

    belfry: {
      art: [
        "      ______",
        "     / BELL \\",
        "    | ^v^()^v^|",
        "    |___||___|",
        "        ||",
      ].join("\n"),
      exits: { west: "roof", down: "hiddenVault" },
      on: {
        pull(ctx, cmd) {
          return /\b(bell|rope|cord)\b/i.test(cmd.dobj || "")
            ? ringBelfryBell(ctx)
            : null;
        },
        ring(ctx, cmd) {
          return /\b(bell|rope|cord)\b/i.test(cmd.dobj || "")
            ? ringBelfryBell(ctx)
            : null;
        },
      },
    },

    // --- The astral treasure vault, reached by altered sight, flight, or belfry --
    hiddenVault: {
      aliases: ["astral chamber", "obsidian chamber"],
      art: [
        "  .==============.",
        "  |  .--------.  |",
        "  |  |  (())  |  |",
        "  |  '--------'  |",
        "  '=============='",
      ].join("\n"),
      dark: true,
      exits: { south: "attic", up: "belfry" },
    },

    // --- The secret basement: the TRUE cliffhanger ending (see garyEnding) ---
    // Reached only on foot, via the floor stair that opens in the ROYAL HALL
    // once every required heirloom is in the reliquary. Entering triggers the ending outright,
    // so this room is essentially never explored interactively — it exists so
    // the destination is valid (and as the seed of BLACKWOOD MANOR II).
    garysLair: {
      art: GARY_LAIR_ART,
      exits: { up: "grandHall" },
    },

    // --- The hidden space reached through the nursery wall or random teleport ---
    betweenWalls: {
      art: ROOM_ART.betweenWalls,
      exits: { out: "grandHall" },
    },

    // ===== BLACKWOOD MANOR II — the thirteen-hour clock (Part II) =============
    // "Nowhere": the ghost's staging point. You leave only by USING the clock.
    p2_awakening: {
      name: "Nowhere",
      desc: "Cold, lightless nowhere. A grand CLOCK ticks backward in your see-through hands.",
      phase: 2,
      art: [
        "    .------.",
        "   / 13  12 \\",
        "  |    ||    |",
        "   \\ backward/",
        "    '------'",
      ].join("\n"),
      searchDesc: "There is nothing here but you, the cold, and the CLOCK. EXAMINE it.",
      exits: {},
      on: {
        look: (ctx) => describeAwakening(ctx),
      },
    },
    // HOUR XIII time-scene: the manor garden long ago, the queen still alive.
    t13_medusaGarden: {
      name: "The Thirteenth Hour",
      desc: "The manor garden, drenched in the green-gold afternoon light of centuries past.",
      phase: 2,
      art: [
        "    ((@))  __",
        "     /||\\ (  )",
        "    / || \\ ~~",
        "  ~~~~~~~~~~~~~",
      ].join("\n"),
      searchDesc: (ctx) => ctx.getFlag("emeraldFreed")
        ? "Only grey STONE and an empty setting remain where the queen stood."
        : "The QUEEN's gaze creeps across the roses; the still POOL throws the light back.",
      exits: {},
      on: {
        look: (ctx) => describeMedusaGarden(ctx),
        say: (ctx) => wailAtQueen(ctx),
      },
    },
  },

  items: {
    // --- reliquary and the lower bell pull (royal hall) ---
    reliquary: {
      names: ["reliquary", "cabinet", "case"], adjectives: ["glass", "glass-fronted", "heirloom", "trophy"],
      loc: "grandHall", fixed: true, container: true, capacity: 20,
      openable: true, open: false, autoOpenOnAccess: true,
      bulkTransferSummary: (ctx) => reliquaryCountLine(ctx),
      desc: `A tall, glass-fronted RELIQUARY cabinet set into the stone wall. Its shelves hold ` +
        `${REQUIRED_FAMILY_ITEM_COUNT} heirloom-shaped recesses behind a pair of carved doors.`,
      on: {
        examine: (ctx) => inspectReliquary(ctx),
        search: (ctx) => inspectReliquary(ctx),
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
            awardSuffix(points);
        },
      },
    },
    bell: {
      names: ["bell"], adjectives: ["brass", "great", "weather-blackened"],
      loc: "belfry", fixed: true, scenery: true,
      searchActions: ["ring", "pull"],
      on: { ring: (ctx) => ringBelfryBell(ctx), pull: (ctx) => ringBelfryBell(ctx) },
    },
    belfryBellRope: {
      names: ["rope", "bell rope", "pull rope"], adjectives: ["upper", "thick", "frayed"],
      loc: "belfry", fixed: true, scenery: true,
      on: { pull: (ctx) => ringBelfryBell(ctx), ring: (ctx) => ringBelfryBell(ctx) },
    },
    belfryBats: {
      names: ["bats", "bat", "colony"], adjectives: ["roosting", "black"],
      loc: "belfry", fixed: true, scenery: true,
      on: {
        examine: () => "Hundreds of black BATS crowd the belfry rafters above the BELL. Dark lenses and " +
          "Blackwood brass glint among them.",
      },
    },
    xrayGoggles: {
      names: ["xray goggles", "goggles", "glasses"],
      adjectives: ["blackwood", "bm", "xray", "x-ray", "brass", "antique"],
      loc: null, takeable: true, treasure: true, points: 20,
      wearable: true, wearSlot: "eyes",
      grantsMushroomVision: true, grantsDarkVision: true,
      progressPoints: 5, progressFlag: "progressItem:xrayGoggles",
    },
    bellCloset: {
      names: ["closet", "bell closet"], adjectives: ["bell", "narrow", "wooden"],
      loc: "grandHall", fixed: true, container: true, openable: true, open: false, capacity: 1,
    },
    closetBellRope: {
      names: ["rope", "bell rope", "pull rope"], adjectives: ["lower", "closet", "thick"],
      loc: "bellCloset", fixed: true, scenery: true,
      on: { pull: (ctx) => pullClosetBellRope(ctx), ring: (ctx) => pullClosetBellRope(ctx) },
    },

    // --- a gift that very much does not want to be opened ---
    mysteryPackage: {
      names: ["package", "box", "parcel", "gift"], adjectives: ["mystery", "nice", "wrapped", "ribboned"],
      loc: "grandHall", takeable: true, readable: true,
      on: { open: openMysteryPackage },
    },

    // --- a bolt of lightning that speared into the floor and is, somehow, still here ---
    lightningBolt: {
      names: ["bolt", "lightning"], adjectives: ["lightning", "crackling", "jagged"],
      loc: null, fixed: true,
      on: { touch: touchLightningBolt },
    },

    // --- getting inside ---
    statue: {
      names: ["statue", "woman"], adjectives: ["stone", "robed"], loc: "garden", fixed: true, scenery: true,
      on: { move: revealKey, push: revealKey, pull: revealKey, examine: revealKey },
    },
    well: {
      names: ["well", "shaft"], loc: "garden", fixed: true, scenery: true,
      on: { enter: descendWell, climb: descendWell },
    },
    frontKey: {
      names: ["key"], adjectives: ["iron", "front", "door", "heavy"], loc: null, takeable: true,
      progressPoints: 5, progressFlag: "progressItem:frontKey",
      consumedOnUnlock: "The old iron key snaps off inside the lock and is spent.",
    },
    mailbox: {
      names: ["mailbox"], adjectives: ["brass"], loc: "porch", fixed: true, container: true,
      openable: true, open: false, capacity: 2,
    },
    letter: {
      names: ["letter"], loc: "mailbox", takeable: true, readable: true,
      on: { read: readLetter, burn: burnLetter },
    },

    // --- the ceremonial brazier + its reward (garden) ---
    brazier: {
      names: ["brazier", "firebowl", "bowl"], adjectives: ["iron", "cold", "ceremonial", "old"],
      loc: "garden", fixed: true,
      on: {
        light: lightBrazier,
        burn: lightBrazier,
        touch(ctx, cmd) {
          return /\bcandelabra\b/i.test(cmd.iobj || "") ? lightBrazier(ctx) : null;
        },
      },
    },
    emberStone: {
      names: ["emerald gem", "gem", "emerald", "stone"], adjectives: ["emerald", "green", "glassy"],
      loc: null, takeable: true,
      on: { take: takeOakGem },
    },
    oakMechanism: {
      names: ["panel", "mechanism", "slots", "slot"], adjectives: ["oak", "iron", "inset"],
      loc: "greatOak", fixed: true, scenery: true, container: true, open: true, capacity: 3,
      bulkTransfer: false,
      bulkTransferMsg: "The mirrored PANEL must be solved deliberately. Place each GEM in its named SLOT.",
      on: { examine: describeOakPanel, search: describeOakPanel, put: putOakGem },
    },
    greenGlassStone: {
      names: ["ruby gem", "gem", "ruby", "stone"], adjectives: ["ruby", "red", "glassy"],
      loc: "oakMechanism", takeable: true,
      on: { take: takeOakGem },
    },
    blueGlassStone: {
      names: ["sapphire gem", "gem", "sapphire", "stone"], adjectives: ["sapphire", "blue", "glassy"],
      loc: "oakMechanism", takeable: true,
      on: { take: takeOakGem },
    },
    oakPlatform: {
      names: ["platform", "lift"], adjectives: ["wooden", "oak", "pulley"],
      loc: null, fixed: true, scenery: true,
      on: { enter: enterOakPlatform, climb: enterOakPlatform },
    },
    signalFlags: {
      names: ["flags", "flag", "signals"], adjectives: ["signal", "faded"],
      loc: "treeFort", fixed: true, scenery: true,
    },
    blanketHideout: {
      names: ["hideout", "blanket", "fort"], adjectives: ["blanket", "secret"],
      loc: "treeFort", fixed: true, scenery: true,
    },
    woodenSlingshot: {
      names: ["slingshot", "catapult"], adjectives: ["wooden", "forked"],
      loc: "treeFort", fixed: true, scenery: true,
    },
    spyglassCradle: {
      names: ["cradle", "mount", "swivel"], adjectives: ["rusted", "spyglass"],
      loc: "treeFort", fixed: true, scenery: true,
    },
    spyglass: {
      names: ["spyglass", "telescope"], adjectives: ["brass", "blackwood", "bm"],
      loc: "treeFort", takeable: true, treasure: true, points: 8,
      on: { examine: inspectSpyglass, search: inspectSpyglass, take: takeSpyglass },
    },

    // --- kitchen edibles: high / sick / help ---
    mushrooms: {
      names: ["mushrooms", "mushroom", "fungus"], adjectives: ["dried", "shriveled", "purple"],
      loc: "kitchen", takeable: true, edible: true, highTurns: 12,
      on: { eat: eatMushrooms },
    },
    outhouseMushrooms: {
      names: ["mushrooms", "mushroom", "fungus"],
      adjectives: ["fresh", "crap-fueled", "purple", "toilet"],
      loc: null, takeable: true, edible: true, fresh: true, highTurns: 12,
      on: { take: takeToiletMushrooms, eat: eatMushrooms },
    },
    burrito: {
      names: ["burrito", "wrap"], adjectives: ["aged", "super", "spicy", "death-wish", "questionable"],
      loc: "kitchen", takeable: true, edible: true,
      on: {
        eat: eatBurrito,
      },
    },
    obsidianEye: {
      names: ["obsidian eye", "eye", "sphere", "orb"], adjectives: ["obsidian", "black", "cold", "glass", "scrying"],
      loc: "hiddenVault", takeable: true, wearable: true, worn: false,
      wearSlot: "forehead", grantsHiddenSight: true,
      on: { take: takeObsidianEye },
    },
    burritoWrapper: {
      names: ["wrapper", "foil", "tinfoil"], adjectives: ["burrito", "crumpled", "used", "tin"],
      loc: null, takeable: true,
    },
    milk: {
      names: ["milk", "bottle"], adjectives: ["cold", "fresh", "glass"],
      loc: "kitchen", takeable: true, drinkable: true,
      on: { drink: drinkMilk },
    },
    apple: {
      names: ["apple"], adjectives: ["red", "crisp", "kitchen"],
      loc: "kitchen", takeable: true, edible: true,
    },
    toilet: {
      names: ["toilet", "hole", "latrine", "loo"], adjectives: ["outhouse", "dark", "earthen"],
      loc: "privy", fixed: true, container: true, open: true, capacity: 8,
      on: {
        sit: useToilet, use: useToilet, enter: useToilet, flush: flushToilet,
        examine: inspectToilet,
      },
    },
    dreadmaw: {
      names: ["dragon", "dreadmaw", "wyrm"], adjectives: ["sleeping", "female", "vast", "ashen"],
      loc: "dragonCaveMouth", fixed: true, scenery: true,
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
    },
    dragonVaultDoor: {
      names: ["door", "vault"], adjectives: ["inner", "black", "sealed", "vault"],
      loc: "trollGate", fixed: true, scenery: true,
      on: { say: answerTrollRiddle },
    },
    caveTroll: {
      names: ["troll", "guard"], adjectives: ["cave", "warty", "broad", "male"],
      loc: "trollGate", fixed: true, scenery: true,
      on: { talk: talkToTroll, wake: talkToTroll },
    },
    dragonHoard: {
      names: ["hoard", "riches", "gold", "treasure"], adjectives: ["dragon", "vast", "dreadmaw"],
      loc: "dreadmawVault", fixed: true, scenery: true,
    },
    backpack: {
      names: ["backpack", "pack", "rucksack"], adjectives: ["sturdy", "canvas", "mining"],
      loc: "deepShaft", takeable: true, wearable: true, worn: false,
      wearSlot: "back", autoWearOnTake: true, carryCapacity: 20,
      progressPoints: 5, progressFlag: "progressItem:backpack",
    },
    headlamp: {
      names: ["headlamp", "lamp"], adjectives: ["mining", "battery", "battered"],
      loc: "mineGallery", takeable: true, wearable: true, wearSlot: "head",
      lightSource: true, selfPowered: true, activatesOnWear: true, lit: false, fuel: 200,
      progressPoints: 5, progressFlag: "progressItem:headlamp",
      lowFuelMsg: "The HEADLAMP dims. Its battery has only a few turns left.",
      outOfFuelMsg: "The HEADLAMP flickers once and its battery dies.",
    },
    familyCrest: {
      names: ["crest", "emblem", "arms"], adjectives: ["family", "blackwood", "silver"],
      loc: "dreadmawVault", takeable: true, treasure: true, points: 15,
      desc: "The BLACKWOOD FAMILY CREST, cast in blackened silver: a raven above crossed keys. One of the " +
        `${REQUIRED_FAMILY_ITEM_COUNT} heirlooms required by the RELIQUARY.`,
    },
    wingedShoes: {
      names: ["shoes", "sandals"], adjectives: ["winged", "gold", "golden"],
      loc: "dreadmawVault", takeable: true, wearable: true, wearSlot: "feet", grantsFlight: true,
      progressPoints: 5, progressFlag: "progressItem:wingedShoes",
      wearMsg: "You lace the WINGED SHOES onto your feet. The little feathers snap taut, beat once — and your heels rise off the floor.",
      wearArt: MAP_MARK + WINGED_SHOES_ART + MAP_MARK,
    },
    hallBed: {
      names: ["bed"], adjectives: ["hall", "narrow", "made"],
      loc: "hallBedroom", fixed: true, scenery: true,
    },
    hallMirror: {
      names: ["mirror", "bedroom mirror", "broken mirror"],
      adjectives: ["hall", "bedroom", "tarnished", "broken"],
      loc: "hallBedroom", fixed: true, scenery: true,
      on: { examine: inspectHallMirror, search: inspectHallMirror },
    },
    mirrorShard: {
      names: ["mirror shard", "shard", "glass shard"],
      adjectives: ["mirror", "glass", "jagged", "central"],
      loc: "hallBedroom", takeable: true,
      on: {
        take: freeMirrorShard,
        pull: freeMirrorShard,
        move: freeMirrorShard,
        remove: freeMirrorShard,
      },
    },
    nightTable: {
      names: ["table", "nightstand"], adjectives: ["night", "bedside", "small"],
      loc: "hallBedroom", fixed: true, scenery: true,
    },
    nightDrawer: {
      names: ["drawer"], adjectives: ["night", "table", "bedside"],
      loc: "hallBedroom", fixed: true, scenery: true,
      container: true, openable: true, open: false, capacity: 3,
    },
    bedsideLamp: {
      names: ["lamp"], adjectives: ["night", "bedside", "table"],
      loc: "hallBedroom", fixed: true, scenery: true,
      lightSource: true, selfPowered: true, lit: false,
    },
    backwardsWatch: {
      names: ["woodblack watch", "woodblack", "watch", "wristwatch"],
      adjectives: ["woodblack", "tarnished", "backwards", "brass", "bm"],
      loc: "nightDrawer", takeable: true, wearable: true, worn: false, wearSlot: "wrist",
      on: {
        examine: (ctx, cmd) => lookThroughWoodblackWatch(ctx, cmd),
        show: (ctx, cmd) => lookThroughWoodblackWatch(ctx, cmd),
        read: (ctx, cmd) => lookThroughWoodblackWatch(ctx, cmd),
      },
    },
    frontDoor: {
      names: ["door", "house", "manor", "mansion"], adjectives: ["front", "oak", "great"],
      loc: "porch", fixed: true, scenery: true, enterTo: "north",
      openable: true, open: false, locked: true, keyId: "frontKey",
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
      names: ["candle", "candlestick"], adjectives: ["white", "wax", "silver", "portable"], loc: "diningRoom",
      takeable: true, lightSource: true, lit: false, fuel: 120,
      on: {
        light(ctx) {
          const c = ctx.item("candlestick");
          if (c.lit) return "It is already lit.";
          if (c.fuel <= 0) return "The candle is a spent stub; it will not catch.";
          const match = carriedMatch(ctx);
          if (!match) return "You have nothing to light it with.";
          c.lit = true;
          ctx.destroy(match.id);
          return "You strike the manor's single match and touch it to the wick. The CANDLE flares to life, throwing " +
            "long shadows — and the spent match crumbles to ash. (You have no more matches.)";
        },
      },
    },
    candelabraFrame: {
      names: ["candelabra", "fixture", "socket", "recess"],
      adjectives: ["rundown", "incomplete", "silver", "dining"],
      loc: "diningRoom", fixed: true, container: true, capacity: 2,
      bulkTransfer: false,
      bulkTransferMsg: "The rundown CANDELABRA must be restored one deliberate piece at a time.",
      on: {
        examine: candelabraFixtureDescription,
        search: candelabraFixtureDescription,
        put: installCandelabraPiece,
      },
    },
    candelabra: {
      names: ["candelabra", "candleholder"],
      adjectives: ["blackwood", "restored", "silver", "lit", "bm"],
      loc: null, takeable: true, treasure: true, points: 10,
      lightSource: true, selfPowered: true, lit: true,
      on: {
        light: () => "The CANDELABRA already burns with five steady blue-white flames.",
        extinguish: keepCandelabraLit,
        off: keepCandelabraLit,
        touch: touchCandelabra,
      },
    },
    matches: {
      names: ["matches", "match"], adjectives: ["box"], loc: "kitchen", takeable: true,
    },
    rope: {
      names: ["rope", "coil"], adjectives: ["stout"], loc: "kitchen", takeable: true,
    },
    cellarDoor: {
      names: ["cellar", "trapdoor", "door"], adjectives: ["heavy", "cellar"],
      loc: "kitchen", fixed: true, scenery: true, enterTo: "down", openable: true, open: false,
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
    },

    // --- parlor safe (behind the profile painting) ---
    portrait: {
      names: ["painting", "profile", "portrait"], adjectives: ["grim", "patriarch", "huge"], loc: "parlor",
      fixed: true, scenery: true,
      on: { move: revealSafe, push: revealSafe, examine: revealSafe },
    },
    safe: {
      names: ["safe"], adjectives: ["iron"], loc: null, fixed: true, container: true, openable: true,
      open: false, locked: true, capacity: 3,
      on: {
        open: openSafe,
      },
    },
    talisman: {
      names: ["talisman", "amulet"], adjectives: ["silver", "protective"], loc: "safe", takeable: true,
      wearable: true, worn: false, wearSlot: "neck", treasure: true, points: 15,
    },

    // --- study diary ---
    desk: {
      names: ["desk"], adjectives: ["oak"], loc: "study", fixed: true, scenery: true,
    },
    diary: {
      names: ["diary", "journal"], adjectives: ["leather", "leather-bound"], loc: "study", takeable: true,
      readable: true,
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
      on: { pull: revealWallGap, push: revealWallGap, search: revealWallGap },
    },

    // --- nursery music box -> tiny key ---
    musicBox: {
      names: ["music box", "musicbox", "box"], adjectives: ["jeweled", "jewelled", "music"], loc: "nursery",
      takeable: true, treasure: true, points: 15, container: true, openable: true, open: false, capacity: 1,
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
    },

    // --- grand bedroom jewelry box -> Ravenblood Ring ---
    jewelryBox: {
      names: ["jewelry box", "jewellery box", "jewelry", "box", "casket"], adjectives: ["walnut", "dark"],
      loc: "masterBedroom", fixed: true, container: true, openable: true, open: false, locked: true,
      keyId: "tinyKey", capacity: 2,
      on: {
        open(ctx) {
          const box = ctx.item("jewelryBox");
          if (box.locked) return "The jewelry box is locked.";
          if (box.open) return "The jewelry box is already open.";
          box.open = true;
          const points = awardProgress(ctx, "jewelryBoxOpened");
          return "You open the JEWELRY BOX, revealing a RAVENBLOOD RING." + awardSuffix(points);
        },
      },
    },
    rubyRing: {
      names: ["ravenblood ring", "ring", "ravenblood", "signet"],
      adjectives: ["ravenblood", "ruby", "red", "blackwood", "blood"], loc: "jewelryBox", takeable: true,
      treasure: true, points: 20, wearable: true, worn: false, wearSlot: "finger",
    },

    // --- crypt ---
    wraith: {
      names: ["wraith", "ghost", "spirit"], loc: "crypt", fixed: true, scenery: true,
    },
    goldLocket: {
      names: ["locket"], adjectives: ["gold"], loc: "crypt", takeable: true, treasure: true, points: 20,
    },

    // --- landing cord (attic ladder) ---
    cord: {
      names: ["cord"], adjectives: ["frayed"], loc: "landing", fixed: true, scenery: true,
      on: {
        pull(ctx) {
          if (ctx.getFlag("ladderDown")) return "The ladder is already down.";
          ctx.setFlag("ladderDown");
          const points = awardProgress(ctx, "atticLadderLowered");
          return "You pull the cord. A trap-door drops open and a rickety wooden ladder clatters down from the attic." +
            awardSuffix(points);
        },
      },
    },

    // --- other treasures ---
    ancientCoin: {
      names: ["coin"], adjectives: ["ancient", "old"], loc: null, takeable: true, treasure: true, points: 10,
    },
    crystalDecanter: {
      names: ["decanter"], adjectives: ["crystal"], loc: "wineCellar", takeable: true, treasure: true, points: 15,
    },
    ancestralPortrait: {
      names: ["portrait", "miniature"], adjectives: ["ancestral", "small", "gilt"], loc: "attic",
      takeable: true, treasure: true, points: 20, scenery: true,
    },

    // --- the heirloom hidden in the space between the walls ---
    blackwoodHammer: {
      names: ["blackwood hammer", "bm hammer", "hammer"],
      adjectives: ["blackwood", "bm", "iron", "ash-handled"],
      loc: "betweenWalls", takeable: true, treasure: true, points: 12,
    },

    // ===== BLACKWOOD MANOR II — Part II items (the thirteen-hour clock) =======
    // The carried talisman. Hidden ("__void") until Gary's blow makes you a
    // ghost; from then on it rides in your hands and USE-ing it moves you in time.
    clockTalisman: {
      names: ["clock", "grand clock", "thirteen-hour clock", "thirteen hour clock", "time clock"],
      adjectives: ["grand", "thirteen-hour", "backward", "ghostly"],
      loc: "__void", takeable: true,
      on: {
        examine: (ctx) => clockTalismanText(ctx),
        read: (ctx) => clockTalismanText(ctx),
        use: (ctx) => useClockTalisman(ctx),
        enter: (ctx) => useClockTalisman(ctx),
        take: (ctx) => takeCountdownClock(ctx),
      },
    },
    // Recovered in hour XIII; PUT/DROP it only in the present-day GARDEN.
    emeraldOfTheQueen: {
      names: ["emerald", "queen's emerald", "queens emerald", "gem"],
      adjectives: ["great", "vast", "green", "queen's"],
      loc: "__void", takeable: true,
      on: {
        examine: () => "A great green emerald the size of a plum, still warm from the throat it was torn from an age ago.",
        put: (ctx) => placeEmeraldInGarden(ctx),
        drop: (ctx) => placeEmeraldInGarden(ctx),
      },
    },
    // Scenery for the hour-XIII scene.
    queenPetrified: {
      names: ["queen", "woman", "medusa", "statue"],
      adjectives: ["petrifying", "emerald", "stone", "grey"],
      loc: "t13_medusaGarden", takeable: false, fixed: true, scenery: true,
      on: {
        examine: (ctx) => {
          if (ctx.getFlag("emeraldFreed")) {
            return "Grey stone now — the queen caught mid-turn, an empty setting at her throat where the emerald blazed.";
          }
          ctx.setFlag("queenFound");
          return "You steal to the statue's place and find her alive: a QUEEN in emerald silk, walking the roses, " +
            "and everywhere her gaze falls the garden hardens to STONE. At her throat burns a vast EMERALD. Let her " +
            "eyes meet yours and you are stone with the roses — but the still POOL at your side throws the light " +
            "back like a mirror. Make her look THERE, not at you. A ghost has one instrument to make her turn: YELL.";
        },
      },
    },
    gardenPool: {
      names: ["pool", "water", "reflection"],
      adjectives: ["still", "dark", "glassy"],
      loc: "t13_medusaGarden", takeable: false, fixed: true, scenery: true,
      on: {
        examine: (ctx) => {
          if (!ctx.getFlag("emeraldFreed")) ctx.setFlag("poolKnown");
          return "A still garden pool, dark as glass. It throws the light back — and any gaze cast into it — with " +
            "perfect, mirror-flat indifference. If her petrifying stare struck this water instead of you, it would " +
            "rebound into her own face.";
        },
      },
    },
  },
};

export const world = composeWorld(logicWorld, content);

// ---- handler function definitions referenced above --------------------------
function inspectWoodblackWatch(ctx) {
  return "The WOODBLACK WATCH has no hands and marks no hour. Its black crystal face reflects the room, then " +
    "quietly shows someplace else. On the back, beneath your reflection, a family inscription reads: " +
    "\"B.W. — WHAT TIME TAKES, BLOOD REMEMBERS.\"";
}

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
