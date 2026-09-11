// gary-voice.js Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

export const DEFAULT_GARY_VOICE_PRESET = "computer-male";

export const GARY_VOICE_PRESETS = Object.freeze([
  {
    id: "computer-male",
    label: "Computer male",
    lang: "en-US",
    names: ["Fred", "Ralph", "Albert", "Aaron", "Arthur", "Reed", "Rocko", "Eddy", "Daniel"],
    pitch: 0.7,
    rate: 1.02,
  },
  {
    id: "computer-female",
    label: "Computer female",
    lang: "en-US",
    names: ["Kathy", "Princess", "Trinoids", "Flo", "Sandy", "Shelley", "Samantha", "Victoria"],
    pitch: 1.25,
    rate: 1.02,
  },
  {
    id: "australian-male",
    label: "Australian male",
    lang: "en-AU",
    names: ["Gordon", "Lee", "Russell", "William", "James"],
    fallbackNames: ["Daniel", "Reed", "Rocko", "Eddy", "Aaron"],
    excludeNames: ["Karen", "Matilda", "Catherine", "Nicole", "Olivia", "Samantha", "Victoria", "Flo", "Sandy", "Shelley"],
    pitch: 0.88,
    rate: 0.98,
  },
  {
    id: "australian-female",
    label: "Australian female",
    lang: "en-AU",
    names: ["Karen", "Matilda", "Catherine", "Nicole", "Olivia"],
    fallbackNames: ["Samantha", "Victoria", "Flo", "Sandy", "Shelley"],
    excludeNames: ["Gordon", "Lee", "Russell", "William", "James", "Daniel", "Reed", "Rocko", "Eddy", "Aaron"],
    pitch: 1,
    rate: 0.98,
  },
]);

export function garyVoiceProfile(presetId) {
  return GARY_VOICE_PRESETS.find((preset) => preset.id === presetId)
    || GARY_VOICE_PRESETS.find((preset) => preset.id === DEFAULT_GARY_VOICE_PRESET);
}

export function pickGaryVoice(voices, presetId) {
  const profile = garyVoiceProfile(presetId);
  const available = Array.from(voices || []);
  const language = profile.lang.toLowerCase();
  const hasPresetLanguage = (voice) =>
    !voice.lang || voice.lang.replace("_", "-").toLowerCase().startsWith(language);
  const isExcluded = (voice) => (profile.excludeNames || []).some((name) =>
    voice.name?.toLowerCase().includes(name.toLowerCase()));
  for (const preferred of profile.names) {
    const voice = available.find((candidate) =>
      hasPresetLanguage(candidate)
      && candidate.name?.toLowerCase().includes(preferred.toLowerCase()));
    if (voice) return voice;
  }
  for (const fallback of profile.fallbackNames || []) {
    const voice = available.find((candidate) =>
      /^en(?:-|_)/i.test(candidate.lang || "")
      && candidate.name?.toLowerCase().includes(fallback.toLowerCase()));
    if (voice) return voice;
  }
  return available.find((voice) => hasPresetLanguage(voice) && !isExcluded(voice))
    || available.find((voice) => /^en(?:-|_)/i.test(voice.lang || "") && !isExcluded(voice))
    || available.find((voice) => !isExcluded(voice))
    || null;
}

export function estimatedSpeechDurationMs(text, rate = 1) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  const wordsPerMinute = 175 * Math.max(rate, 0.5);
  return Math.min(20000, Math.max(1400, Math.round((words / wordsPerMinute) * 60000 + 400)));
}

// end gary-voice.js
