// gem-slots.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-09.002:acoven.
//
// Shared bulk commands for the two three-slot gem panels (GREAT OAK and LOWER PANEL):
// TAKE GEMS pulls every seated gem; FILL SLOTS <order> / PUT GEMS IN SLOTS <order>
// seats three named gems TOP, MIDDLE, BOTTOM. Orders accept words or initials with
// any separator: "yellow, magenta, cyan", "y m c", "y/m/c", "y-m-c", or "ymc".

const SLOT_WORDS = /^(?:the\s+)?(?:lower\s+)?(?:slots?|panel|holes?)\b/;
const GEM_WORDS = new Set(["gems", "gem", "stones", "all", "all gems", "all the gems", "all stones", "the gems", "jewels"]);
const FILLER = /\b(?:and|then|in|order|from|top|to|bottom|with|gems?|stones?|the|slots?)\b/g;
export const SLOT_ORDER_TOP_DOWN = Object.freeze(["top", "middle", "bottom"]);

function clean(value) {
  return String(value || "").toLowerCase().trim();
}

// Returns the order text (possibly empty) when the command is a bulk fill, else null.
export function fillOrderText(cmd) {
  const dobj = clean(cmd.dobj);
  const iobj = clean(cmd.iobj);
  if (cmd.verb === "fill") {
    const match = SLOT_WORDS.exec(dobj);
    if (!match) return null;
    return `${dobj.slice(match[0].length)} ${iobj}`.trim();
  }
  if (cmd.verb === "put" && GEM_WORDS.has(dobj) && SLOT_WORDS.test(iobj)) {
    return iobj.replace(SLOT_WORDS, "").trim();
  }
  return null;
}

export function isTakeGems(cmd) {
  if (cmd.verb !== "take") return false;
  const dobj = clean(cmd.dobj);
  const fromPanel = SLOT_WORDS.test(clean(cmd.iobj));
  return (GEM_WORDS.has(dobj) && dobj !== "all") || (dobj === "all" && fromPanel);
}

// codes: { gemId: ["word", "w", ...] }. Returns [topId, middleId, bottomId] or null.
export function parseGemOrder(text, codes) {
  const lookup = new Map();
  for (const [id, words] of Object.entries(codes)) for (const word of words) lookup.set(word, id);
  let tokens = clean(text).replace(/[,/\\\-;&+|:.]+/g, " ").replace(FILLER, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 1 && tokens[0].length === 3 && [...tokens[0]].every((letter) => lookup.has(letter))) {
    tokens = [...tokens[0]];
  }
  const ids = tokens.map((token) => lookup.get(token));
  if (ids.length !== 3 || ids.some((id) => !id) || new Set(ids).size !== 3) return null;
  return ids;
}

function firstSentence(text) {
  const awards = (String(text).match(/(?:\s\(\+\d+\))+$/) || [""])[0];
  return String(text).split(/(?<=\.)\s/)[0] + awards;
}

// panel: { codes, labels, seatedIds(), take(id), put(id, slot), alignedMessage() }
export function takeAllGems(ctx, panel) {
  const aligned = panel.alignedMessage();
  if (aligned) return aligned;
  const seated = panel.seatedIds();
  if (!seated.length) return "The slots are already empty.";
  const out = [];
  for (const id of seated) {
    const result = panel.take(id);
    if (!/^You lift/.test(result)) return [...out, result].join("\n");
    out.push(result + ctx.awardPickup(ctx.item(id)));
  }
  return out.join("\n");
}

export function fillGemSlots(ctx, panel, orderText) {
  const aligned = panel.alignedMessage();
  if (aligned) return aligned;
  if (!orderText) return "Name the three gems in order, top to bottom, like FILL SLOTS followed by their colors.";
  const order = parseGemOrder(orderText, panel.codes);
  if (!order) return "Name each of the three gems once, in order from top to bottom.";

  const seated = new Set(panel.seatedIds());
  const out = [];
  for (const id of order) {
    if (ctx.has(id) || seated.has(id)) continue;
    if (ctx.roomOf(id) !== ctx.state.room) return `You don't have the ${panel.labels[id]}.`;
    if (ctx.inventoryLoad() >= ctx.inventoryCapacity()) {
      return `Your hands are full. You'll have to drop something before picking up the ${panel.labels[id]}.`;
    }
    ctx.moveItem(id, "inventory");
    out.push(`You pick up the ${panel.labels[id]}.${ctx.awardPickup(ctx.item(id))}`);
  }
  for (const id of seated) {
    const result = panel.take(id);
    if (!/^You lift/.test(result)) return [...out, result].join("\n");
    out.push(result + ctx.awardPickup(ctx.item(id)));
  }
  order.forEach((id, index) => {
    const result = panel.put(id, SLOT_ORDER_TOP_DOWN[index]);
    out.push(index === order.length - 1 ? result : firstSentence(result));
  });
  return out.join("\n");
}

// end gem-slots.js
