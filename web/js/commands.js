// commands.js — generic verb handlers. Content-free engine.
// Each handler is (ctx, cmd) => string, where ctx is the game object from core.js
// and cmd is { verb, dobj, prep, iobj }. Handlers mutate live item objects
// returned by ctx.find/ctx.itemsIn (which persist in game state).

export const commands = {
  go(ctx, cmd) {
    const dir = cmd.dobj;
    const room = ctx.room();
    let exit = room.exits && room.exits[dir];
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
    // "look" alone describes the room; "look <thing>" examines it.
    if (cmd.dobj) return commands.examine(ctx, cmd);
    return ctx.describeRoom(true);
  },

  examine(ctx, cmd) {
    if (!cmd.dobj) return "Examine what?";
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
      inv.map((i) => "  a " + [...(i.adjectives || []).slice(0, 1), i.names[0]].join(" ")).join("\n");
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
        inside.map((x) => "a " + x.names[0]).join(", ") + ".";
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
    if (!cmd.dobj) return "Search what?";
    const it = ctx.find(cmd.dobj);
    if (!it) return `You can't see any ${cmd.dobj} here.`;
    return "You find nothing of interest.";
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
  enter(ctx, cmd) {
    if (cmd.dobj) return commands.go(ctx, { ...cmd, dobj: "in" });
    return "Enter what?";
  },
  give(ctx) { return "There's no one here to give it to."; },
  pray(ctx) { return "Nothing happens. Perhaps something is missing."; },
  sit(ctx, cmd) { return `You sit. ${cmd.dobj ? "The " + cmd.dobj + " is unmoved by the gesture." : "The floor is cold and unhelpful."}`; },
  use(ctx, cmd) { return cmd.dobj ? `You can't see a way to use the ${cmd.dobj}.` : "Use what?"; },
  flush(ctx, cmd) { return "There's nothing here to flush."; },

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
  verbose(ctx) { ctx.setFlag("__verbose", true); return "Maximum verbosity."; },
  brief(ctx) { ctx.setFlag("__verbose", false); return "Brief descriptions."; },
  again() { return null; }, // handled by UI (repeat last); no-op in core
  help() {
    return [
      "COMMANDS",
      "Move: n s e w  ne nw se sw  up down",
      "  in out   (or: go <dir>)",
      "look (l), examine <x>, search <x>",
      "take <x>, drop <x>, inventory (i)",
      "open / close / unlock <x> with <y>",
      "put <x> in <y>, read <x>",
      "light <x>, turn on/off <x>",
      "wear / remove, eat / drink",
      "push / pull / move, ring <x>",
      "score save restore restart quit",
      "",
      "Stuck? Tap CALL (or type CALL) for",
      "Gary's hint line. Say HANG UP to",
      "leave. Beware the dark — keep a",
      "light burning.",
    ].join("\n");
  },
};
