// radio.js. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-11-08.001:acoven.

import { RADIO_SONGS } from "./radio-clues.js?v=source";

const RADIO_SEED = "realm:radioSeed";
const RADIO_ROUND = "realm:radioRound";
const RADIO_STREAK = "realm:radioStreak";
const RADIO_PREVIOUS_SONG = "realm:radioPreviousSong";
const RADIO_WON = "realm:radioWon";

function nextSeed(ctx) {
  let seed = ctx.getFlag(RADIO_SEED);
  if (!Number.isInteger(seed)) {
    seed = Math.floor(Math.random() * 0x100000000) >>> 0;
  }
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  ctx.setFlag(RADIO_SEED, seed);
  return seed;
}

function choose(ctx, candidates) {
  return candidates[nextSeed(ctx) % candidates.length];
}

function drawRound(ctx) {
  const previous = ctx.getFlag(RADIO_PREVIOUS_SONG);
  const songCandidates = RADIO_SONGS
    .map((_, index) => index)
    .filter((index) => index !== previous);
  const songIndex = choose(ctx, songCandidates);
  const clueIndex = nextSeed(ctx) % RADIO_SONGS[songIndex].clues.length;
  const distractorCandidates = RADIO_SONGS
    .map((_, index) => index)
    .filter((index) => index !== songIndex);
  const optionIndices = [];
  for (let count = 0; count < 4; count++) {
    const position = nextSeed(ctx) % distractorCandidates.length;
    optionIndices.push(distractorCandidates.splice(position, 1)[0]);
  }
  optionIndices.push(songIndex);
  for (let index = optionIndices.length - 1; index > 0; index--) {
    const other = nextSeed(ctx) % (index + 1);
    [optionIndices[index], optionIndices[other]] = [optionIndices[other], optionIndices[index]];
  }
  const round = {
    songIndex,
    clueIndex,
    optionIndices,
    correctOption: optionIndices.indexOf(songIndex) + 1,
  };
  ctx.setFlag(RADIO_PREVIOUS_SONG, songIndex);
  ctx.setFlag(RADIO_ROUND, round);
  return round;
}

function activeRound(ctx) {
  const round = ctx.getFlag(RADIO_ROUND);
  return round
    && Number.isInteger(round.songIndex)
    && Number.isInteger(round.clueIndex)
    && Array.isArray(round.optionIndices)
    && Number.isInteger(round.correctOption)
    ? round
    : null;
}

function printRound(ctx, round) {
  const song = RADIO_SONGS[round.songIndex];
  const options = round.optionIndices
    .map((songIndex, index) => `${index + 1}. ${RADIO_SONGS[songIndex].title}`);
  const streak = Number(ctx.getFlag(RADIO_STREAK)) || 0;
  return `CLUE: ${song.clues[round.clueIndex]}\n${options.join("\n")}\n` +
    `ANSWER 1 TO 5 or SAY the full song title. Correct in a row: ${streak}/3.`;
}

function startQuiz(ctx) {
  if (ctx.getFlag(RADIO_WON)) {
    return "The cabinet has already opened. The PORTABLE TRANSISTOR RADIO is yours to take.";
  }
  const round = activeRound(ctx) || drawRound(ctx);
  return `The CABINET RADIO coughs awake.\n${printRound(ctx, round)}`;
}

function normalizeTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !["a", "an", "the"].includes(word))
    .join(" ");
}

function spokenAnswer(cmd) {
  return [cmd.dobj, cmd.prep, cmd.iobj].filter(Boolean).join(" ");
}

function answerQuiz(ctx, cmd) {
  if (ctx.getFlag(RADIO_WON)) {
    return "The cabinet has already opened. The PORTABLE TRANSISTOR RADIO is yours to take.";
  }
  const round = activeRound(ctx);
  if (!round) return "Turn on the CABINET RADIO or LISTEN first.";

  const answer = spokenAnswer(cmd);
  if (!answer) return "ANSWER 1 TO 5 or SAY a listed song title.";

  let selectedOption = null;
  if (/^\d+$/.test(answer)) {
    const number = Number(answer);
    if (number < 1 || number > 5) {
      return "Pick a number from 1 to 5; the clue hasn't changed.";
    }
    selectedOption = number;
  } else {
    const normalized = normalizeTitle(answer);
    selectedOption = round.optionIndices.findIndex(
      (songIndex) => normalizeTitle(RADIO_SONGS[songIndex].title) === normalized,
    ) + 1;
    if (!selectedOption) {
      return "That is not one of the five full song titles. The clue stays put.";
    }
  }

  const selectedSong = RADIO_SONGS[round.optionIndices[selectedOption - 1]];
  if (selectedOption === round.correctOption) {
    const streak = (Number(ctx.getFlag(RADIO_STREAK)) || 0) + 1;
    ctx.setFlag(RADIO_STREAK, streak);
    if (streak === 3) {
      ctx.setFlag(RADIO_WON);
      ctx.setFlag(RADIO_ROUND, null);
      ctx.item("cabinetRadio").open = true;
      const points = ctx.awardProgress("radioWon");
      return "Three in a row! The CABINET RADIO rattles like a locker full of angry spoons. " +
        "Its door swings wide, revealing a PORTABLE TRANSISTOR RADIO in a scuffed leather case." +
        (points ? ` (+${points})` : "");
    }
    const nextRound = drawRound(ctx);
    return "Correct. The CABINET RADIO applauds itself with a tinny drum roll. " +
      `Streak: ${streak}/3.\n\n${printRound(ctx, nextRound)}`;
  }

  ctx.setFlag(RADIO_STREAK, 0);
  const nextRound = drawRound(ctx);
  return `Wrong. The CABINET RADIO plays ${selectedSong.title} back in a cracking falsetto without ` +
    `getting through a single note. Streak: 0/3.\n\n${printRound(ctx, nextRound)}`;
}

function transistorUse(ctx) {
  const radio = ctx.item("portableTransistorRadio");
  return "The TRANSISTOR RADIO crackles, catches one cheerful drum hit, and loses the station. No quiz follows." +
    ctx.awardUse(radio);
}

function isPortableRadioName(phrase) {
  return [
    "portable transistor radio",
    "transistor radio",
    "portable radio",
    "transistor",
  ].includes(normalizeTitle(phrase));
}

const rooms = {};
const items = {
  cabinetRadio: {
    names: ["cabinet radio", "radio cabinet", "radio", "cabinet"],
    loc: "avClubDen",
    fixed: true,
    scenery: true,
    container: true,
    openable: true,
    open: false,
    on: {
      on: startQuiz,
      listen: startQuiz,
      use: startQuiz,
      open(ctx) {
        return ctx.getFlag(RADIO_WON)
          ? "The cabinet is already open."
          : "The cabinet door stays shut. It will swing open after three right answers in a row.";
      },
      take(ctx) {
        return ctx.getFlag(RADIO_WON)
          ? null
          : "The cabinet door hides whatever is inside.";
      },
    },
  },
  portableTransistorRadio: {
    names: ["portable transistor radio", "transistor radio", "portable radio", "transistor"],
    loc: "cabinetRadio",
    takeable: true,
    treasure: true,
    points: 15,
    on: {
      listen: transistorUse,
      use: transistorUse,
    },
  },
};

const content = {
  items: {
    cabinetRadio: {
      roomDesc: "A massive CABINET RADIO waits beneath a tangle of cords.",
      desc: "The CABINET RADIO has five numbered buttons and a door whose hinge points inward. " +
        "A faded card reads: THREE RIGHT IN A ROW. Turn it ON or LISTEN for a clue.",
    },
    portableTransistorRadio: {
      roomDesc: "A PORTABLE TRANSISTOR RADIO rests inside the opened cabinet.",
      desc: "A battery-powered PORTABLE TRANSISTOR RADIO in a scuffed leather case, with a strap and a " +
        "telescoping antenna. A small BM stamp sits beneath the tuning knob.",
    },
  },
};

const shortNames = {
  rooms: {},
  items: {
    cabinetRadio: "radio",
    portableTransistorRadio: "transistor",
  },
};

const progressAwards = {
  radioWon: 10,
};

const hints = [
  (ctx) => ({
    topics: ["cabinet", "radio"],
    done: !!ctx.getFlag(RADIO_WON),
    text: "TURN ON or LISTEN TO the CABINET RADIO, then ANSWER with a number from 1 to 5 or SAY a full listed title.",
  }),
  (ctx) => ({
    topics: ["quiz", "song", "songs", "clue"],
    done: !!ctx.getFlag(RADIO_WON),
    text: "Get three right without a miss. A wrong answer puts your streak back at zero; remember the clue, not any song lyric.",
  }),
  (ctx) => ({
    topics: ["transistor", "portable", "radio"],
    done: ctx.has("portableTransistorRadio"),
    text: "The cabinet swings open after three correct answers. TAKE the smaller RADIO inside.",
  }),
];

const roomHooks = {
  avClubDen: {
    say: answerQuiz,
    take(ctx, cmd) {
      return !ctx.getFlag(RADIO_WON) && isPortableRadioName(cmd.dobj)
        ? "The cabinet door hides whatever is inside."
        : null;
    },
  },
};

const flavorPools = {};

export default { rooms, items, content, shortNames, progressAwards, hints, roomHooks, flavorPools };

// end radio.js
