// commands.js — generic verb handlers. Content-free engine.
// Each handler is (ctx, cmd) => string, where ctx is the game object from core.js
// and cmd is { verb, dobj, prep, iobj }. Handlers mutate live item objects
// returned by ctx.find/ctx.itemsIn (which persist in game state).

import { renderMap } from "./map.js";

const normalizeRoomName = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function resolveRoom(ctx, phrase) {
  const wanted = normalizeRoomName(phrase);
  if (!wanted) return null;
  const exact = Object.entries(ctx.world.rooms).find(([id, room]) =>
    [id, room.name, ...(room.aliases || [])].some((name) => normalizeRoomName(name) === wanted));
  if (exact) return exact;
  const suffixMatches = Object.entries(ctx.world.rooms).filter(([id, room]) =>
    [id, room.name, ...(room.aliases || [])].some((name) => normalizeRoomName(name).endsWith(wanted)));
  return suffixMatches.length === 1 ? suffixMatches[0] : null;
}

function suggestedActions(ctx, item) {
  const actions = [];
  if (item.takeable && !ctx.has(item.id)) actions.push("TAKE");
  if (item.openable) {
    if (item.locked) actions.push("UNLOCK");
    actions.push(item.open ? "CLOSE" : "OPEN");
  }
  if (item.container) actions.push("PUT ITEMS IN");
  if (item.readable || item.text) actions.push("READ");
  if (item.edible) actions.push("EAT");
  if (item.drinkable) actions.push("DRINK");
  if (item.wearable && !item.worn) actions.push("WEAR");
  if (item.lightSource && !item.lit) actions.push("LIGHT");

  const definition = ctx.world.items[item.id];
  for (const verb of Object.keys((definition && definition.on) || {})) {
    if (verb !== "search") actions.push(verb.toUpperCase());
  }
  for (const verb of item.searchActions || []) actions.push(verb.toUpperCase());
  if (!actions.length && (item.fixed || item.scenery)) actions.push("EXAMINE");
  return [...new Set(actions)];
}

function notableItems(ctx) {
  const direct = ctx.itemsIn(ctx.state.room);
  const visible = [...direct];
  for (const item of direct) {
    if (item.container && item.open) visible.push(...ctx.itemsIn(item.id));
  }
  const lines = visible
    .map((item) => ({ item, actions: suggestedActions(ctx, item) }))
    .filter(({ actions }) => actions.length)
    .map(({ item, actions }) => `* ${(item.names[0] || item.id).toUpperCase()}: ${actions.join(", ")}`);
  return lines.length ? "\n\nTHINGS YOU CAN ACT ON\n" + lines.join("\n") : "";
}

function inspectRoom(ctx) {
  const base = ctx.describeRoom(true);
  if (!ctx.isLit()) return base;
  const room = ctx.room();
  const detail = typeof room.searchDesc === "function"
    ? room.searchDesc(ctx)
    : room.searchDesc;
  return base + "\n\nCLOSER INSPECTION\n" +
    (detail || "You make a careful circuit of the room but find no further clue demanding attention.") +
    notableItems(ctx);
}

function takeAll(ctx, cmd) {
  const candidates = ctx.visibleItems().filter((item) => item.takeable && !ctx.has(item.id));
  if (!candidates.length) return "There is nothing here you can take.";

  const results = [];
  const leftBehind = [];
  const limit = ctx.world.config.maxCarry ?? 99;
  for (const item of candidates) {
    if (ctx.inventory().length >= limit) {
      leftBehind.push(item.names[0]);
      continue;
    }
    const handler = ctx.world.items[item.id]?.on?.take;
    const handled = handler ? handler(ctx, { ...cmd, dobj: item.names[0] }) : null;
    if (handled != null) {
      results.push(`${item.names[0]}: ${handled}`);
      continue;
    }
    ctx.moveItem(item.id, "inventory");
    results.push(`${item.names[0].toUpperCase()}: Taken.`);
  }
  if (leftBehind.length) {
    results.push(`Your hands are full. Left behind: ${leftBehind.join(", ")}.`);
  }
  return results.join("\n");
}

export const commands = {
  go(ctx, cmd) {
    const dir = cmd.dobj;
    const room = ctx.room();
    let exit = room.exits && room.exits[dir];
    if (!exit && (ctx.getFlag("high") || 0) > 0) {
      const destination = resolveRoom(ctx, dir);
      if (destination) {
        const [roomId, roomDef] = destination;
        if (typeof ctx.world.floatTo === "function") return ctx.world.floatTo(ctx, roomId);
        ctx.state.room = roomId;
        return `You float weightlessly to ${roomDef.name}.\n\n${ctx.describeRoom()}`;
      }
    }
    if (!exit) return "You can't go that way.";
    if (typeof exit === "object") {
      if (exit.locked) return exit.lockedMsg || "That way is locked.";
      if (exit.via && !ctx.getFlag(exit.via)) return exit.lockedMsg || "You can't go that way.";
      exit = exit.to;
    }
    ctx.state.room = exit;
    return ctx.describeRoom();
  },

  look(ctx, cmd) {
    // The parser normally canonicalizes item forms to EXAMINE. Keep this
    // fallback so callers constructing command objects directly behave too.
    if (cmd.dobj) return commands.examine(ctx, cmd);
    return inspectRoom(ctx);
  },

  examine(ctx, cmd) {
    if (!cmd.dobj) return inspectRoom(ctx);
    if (!ctx.isLit()) return "It's too dark to see anything.";
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    let out = it.desc || `You see nothing special about the ${it.names[0]}.`;
    if (it.container && it.openable) out += it.open ? " It is open." : " It is closed.";
    if (it.container && it.open) {
      const inside = ctx.itemsIn(it.id);
      if (inside.length) out += "\nIt contains: " + inside.map((x) => "a " + x.names[0]).join(", ") + ".";
      else out += " It is empty.";
    }
    if (it.lightSource) out += it.lit ? " It is lit." : "";
    return out;
  },

  take(ctx, cmd) {
    if (!cmd.dobj) return "Take what?";
    if (cmd.dobj === "all" || cmd.dobj === "everything") return takeAll(ctx, cmd);
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (ctx.has(it.id)) return "You already have that.";
    if (it.fixed || !it.takeable) return "That's hardly portable.";
    if (ctx.inventory().length >= (ctx.world.config.maxCarry ?? 99))
      return "Your hands are full. You'll have to drop something first.";
    ctx.moveItem(it.id, "inventory");
    return "Taken.";
  },

  drop(ctx, cmd) {
    if (!cmd.dobj) return "Drop what?";
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it) return "You aren't carrying that.";
    ctx.moveItem(it.id, ctx.state.room);
    return "Dropped.";
  },

  inventory(ctx) {
    const inv = ctx.inventory();
    if (!inv.length) return "You are empty-handed.";
    return "You are carrying:\n" +
      inv.map((i) => "  " + [...(i.adjectives || []).slice(0, 1), i.names[0]].join(" ").toUpperCase()).join("\n");
  },

  open(ctx, cmd) {
    if (!cmd.dobj) return "Open what?";
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (!it.openable) return "That isn't something you can open.";
    if (it.locked) return `The ${it.names[0]} is locked.`;
    if (it.open) return "It's already open.";
    it.open = true;
    const inside = it.container ? ctx.itemsIn(it.id) : [];
    if (inside.length)
      return `You open the ${it.names[0]}, revealing ` +
        inside.map((x) => x.names[0].toUpperCase()).join(", ") + ".";
    return `You open the ${it.names[0]}.`;
  },

  close(ctx, cmd) {
    if (!cmd.dobj) return "Close what?";
    const it = ctx.find(cmd.dobj);
    if (!it || !it.openable) return "That isn't something you can close.";
    if (!it.open) return "It's already closed.";
    it.open = false;
    return `You close the ${it.names[0]}.`;
  },

  unlock(ctx, cmd) {
    if (!cmd.dobj) return "Unlock what?";
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (!("locked" in it)) return "That doesn't have a lock.";
    if (!it.locked) return "It's already unlocked.";
    const key = cmd.iobj ? ctx.find(cmd.iobj, ctx.inventory()) : null;
    if (!key) return "Unlock it with what?";
    if (it.keyId !== key.id) return "That doesn't fit the lock.";
    it.locked = false;
    return `You unlock the ${it.names[0]}.`;
  },

  lock(ctx, cmd) {
    if (!cmd.dobj) return "Lock what?";
    const it = ctx.find(cmd.dobj);
    if (!it || !("locked" in it)) return "That doesn't have a lock.";
    if (it.open) return "You must close it first.";
    const key = cmd.iobj ? ctx.find(cmd.iobj, ctx.inventory()) : null;
    if (!key || it.keyId !== key.id) return "That doesn't fit the lock.";
    it.locked = true;
    return `You lock the ${it.names[0]}.`;
  },

  put(ctx, cmd) {
    if (!cmd.dobj) return "Put what?";
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it) return "You aren't carrying that.";
    if (!cmd.iobj) return "Put it where?";
    const dest = ctx.find(cmd.iobj);
    if (!dest) return `You can't see any ${cmd.iobj} here.`;
    if (!dest.container) return "You can't put anything in that.";
    if (dest.openable && !dest.open) return `The ${dest.names[0]} is closed.`;
    if (ctx.itemsIn(dest.id).length >= (dest.capacity ?? 99)) return "There's no room left in it.";
    ctx.moveItem(it.id, dest.id);
    return `You put the ${it.names[0]} in the ${dest.names[0]}.`;
  },

  read(ctx, cmd) {
    if (!cmd.dobj) return "Read what?";
    if (!ctx.isLit()) return "It's too dark to read.";
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (!it.readable && !it.text) return "There's nothing to read on that.";
    return it.text || "It's blank.";
  },

  search(ctx, cmd) {
    if (!cmd.dobj) return inspectRoom(ctx);
    return commands.examine(ctx, cmd);
  },

  light(ctx, cmd) {
    if (!cmd.dobj) return "Light what?";
    const it = ctx.find(cmd.dobj);
    if (!it || !it.lightSource) return "You can't light that.";
    if (it.lit) return "It's already lit.";
    if (typeof it.fuel === "number" && it.fuel <= 0) return "It's burned out; it won't catch.";
    const hasMatch = ctx.inventory().some((i) =>
      (i.names || []).some((n) => n === "match" || n === "matches"));
    if (!hasMatch) return "You have nothing to light it with.";
    it.lit = true;
    return `The ${it.names[0]} flickers to life, throwing shadows against the walls.`;
  },
  extinguish(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it || !it.lightSource) return "That isn't lit.";
    if (!it.lit) return "It isn't lit.";
    it.lit = false;
    return `You extinguish the ${it.names[0]}.`;
  },
  on(ctx, cmd) { return commands.light(ctx, cmd); },
  off(ctx, cmd) { return commands.extinguish(ctx, cmd); },

  wear(ctx, cmd) {
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it) return "You aren't carrying that.";
    if (!it.wearable) return "You can't wear that.";
    if (it.worn) return "You're already wearing it.";
    it.worn = true;
    return `You put on the ${it.names[0]}.`;
  },
  remove(ctx, cmd) {
    const it = ctx.find(cmd.dobj, ctx.inventory());
    if (!it || !it.worn) return "You aren't wearing that.";
    it.worn = false;
    return `You take off the ${it.names[0]}.`;
  },

  eat(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (!it.edible) return "That's hardly edible.";
    ctx.destroy(it.id);
    return `You eat the ${it.names[0]}. Not bad.`;
  },
  drink(ctx, cmd) {
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    if (!it.drinkable) return "You can't drink that.";
    ctx.destroy(it.id);
    return `You drink the ${it.names[0]}.`;
  },

  // Verbs that are meaningful only via content handlers get a gentle default.
  move(ctx, cmd) { return `You shove the ${cmd.dobj || "thing"}, but nothing happens.`; },
  push(ctx, cmd) { return `Pushing the ${cmd.dobj || "thing"} accomplishes nothing.`; },
  pull(ctx, cmd) { return `You pull the ${cmd.dobj || "thing"}, to no effect.`; },
  attack(ctx, cmd) { return "Violence isn't the answer to this one."; },
  burn(ctx, cmd) {
    if (!cmd.dobj) return "Burn what?";
    return `You can't quite bring yourself to set fire to the ${cmd.dobj}.`;
  },
  throw(ctx) { return "That would be unwise."; },
  ring(ctx, cmd) { return `You ring the ${cmd.dobj || "thing"}, but nothing answers.`; },
  touch(ctx, cmd) { return "You feel nothing unexpected."; },
  listen() { return "You hear the old house settling, and something you'd rather not name."; },
  smell() { return "Dust, rot, and cold ash."; },
  climb(ctx, cmd) { return `You can't climb the ${cmd.dobj || "that"}.`; },
  reach() { return "You reach into the darkness and find nothing useful."; },
  code() { return "There is no combination lock waiting for that code."; },
  enter(ctx, cmd) {
    if (!cmd.dobj) return "Enter what?";
    const target = ctx.find(cmd.dobj);
    if (target && target.enterTo) return commands.go(ctx, { ...cmd, dobj: target.enterTo });
    return commands.go(ctx, { ...cmd, dobj: "in" });
  },
  give(ctx) { return "There's no one here to give it to."; },
  talk() { return "No one answers."; },
  wake() { return "Nothing here seems inclined to wake up."; },
  pray(ctx) { return "Nothing happens. Perhaps something is missing."; },
  sit(ctx, cmd) { return `You sit. ${cmd.dobj ? "The " + cmd.dobj + " is unmoved by the gesture." : "The floor is cold and unhelpful."}`; },
  use(ctx, cmd) { return cmd.dobj ? `You can't see a way to use the ${cmd.dobj}.` : "Use what?"; },
  flush(ctx, cmd) { return "There's nothing here to flush."; },
  yes() { return "There is nothing waiting for confirmation."; },
  no() { return "There is nothing waiting for refusal."; },

  wait() { return "Time passes."; },

  // The 1-900 hint line. The grumpy content + progress-aware hints live in
  // world.js (ctx.world.hotline); this is just the plumbing.
  hotline(ctx) {
    if (typeof ctx.world.hotline !== "function")
      return "There's no phone here, and no one who'd pick up if there were.";
    ctx.setFlag("onCall", true); // you're now on the line — see core.send routing
    return ctx.world.hotline(ctx);
  },

  score(ctx) {
    let s = `Your score is ${ctx.state.score} in ${ctx.state.turns} turns.\nRank: ${ctx.rank()}`;
    const bill = ctx.getFlag("phoneBill");
    if (bill) s += `\nHint Line phone bill: $${(bill / 100).toFixed(2)} — Gary thanks you for your patronage.`;
    return s;
  },
  // MAP MODE — the torn page Gary faxes you when you're properly lost. Rooms
  // you haven't entered stay masked, so it orients you without solving anything.
  map(ctx) {
    ctx.setFlag("usedMap", true);
    return renderMap(ctx);
  },

  verbose(ctx) { ctx.setFlag("__verbose", true); return "Maximum verbosity."; },
  brief(ctx) { ctx.setFlag("__verbose", false); return "Brief descriptions."; },
  again() { return null; }, // handled by UI (repeat last); no-op in core
  help() {
    return [
      "COMMANDS",
      "Move: n s e w  ne nw se sw  up down",
      "  in out   (or: go <dir>)",
      "look (l), examine (ex/x), search — inspect the room more closely",
      "look at <x>, examine <x>, search <x> — inspect an item",
      "map — Gary's floor plan of the manor (MAP MODE)",
      "take <x>, take all, drop <x>, inventory (i)",
      "open / close / unlock <x> with <y>",
      "put <x> in <y>, read <x>",
      "light <x>, turn on/off <x>",
      "wear / remove, eat / drink",
      "push / pull / move, reach into <x>, talk to / wake <x>, give <x> to <y>, ring <x>",
      "score save restore restart quit",
      "ai — is Gary's on-device model running, or is he scripted?",
      "",
      "Chain commands with . ; , or THEN:",
      "  n. open mailbox. read letter",
      "(the line stops at the first word",
      " I don't know)",
      "",
      "Stuck? Tap CALL (or type CALL) for",
      "Gary's hint line. Say HANG UP to",
      "leave. Beware the dark — keep a",
      "light burning.",
    ].join("\n");
  },
};
