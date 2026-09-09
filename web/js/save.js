// save.js — localStorage persistence (browser only).
const KEY = "blackwood-save-v1";

export function saveGame(game, slot = KEY) {
  try {
    localStorage.setItem(slot, JSON.stringify(game.snapshot()));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(game, slot = KEY) {
  const raw = localStorage.getItem(slot);
  if (!raw) return false;
  try {
    game.restore(JSON.parse(raw));
    return true;
  } catch {
    return false;
  }
}

export function hasSave(slot = KEY) {
  try { return !!localStorage.getItem(slot); } catch { return false; }
}
