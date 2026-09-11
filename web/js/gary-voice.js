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
    pitch: 0.88,
    rate: 0.98,
  },
  {
    id: "australian-female",
    label: "Australian female",
    lang: "en-AU",
    names: ["Karen", "Matilda", "Catherine", "Nicole", "Olivia"],
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
  for (const preferred of profile.names) {
    const voice = available.find((candidate) =>
      hasPresetLanguage(candidate)
      && candidate.name?.toLowerCase().includes(preferred.toLowerCase()));
    if (voice) return voice;
  }
  return available.find(hasPresetLanguage)
    || available.find((voice) => /^en(?:-|_)/i.test(voice.lang || ""))
    || available[0]
    || null;
}

// end gary-voice.js
