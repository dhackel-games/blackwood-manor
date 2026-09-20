// Shared "How to Play" onboarding overlay. Builds the same tutorial the 2D map
// shows, so the text game presents it consistently. Self-contained: owns the
// heirloom list + lore, builds its own DOM, and wires open/close, the clickable
// mode cards, and the floating backstory popovers.
//
// Call initHowto({ iconBase, currentMode, onEnter, onTour, onSwitchText,
// onSwitch2d }) once after the DOM exists.

const HEIRLOOMS = [
  ["spyglass", "spyglass"],
  ["batSightMirror", "bat-sight mirror"],
  ["familyCrest", "family crest"],
  ["candlestick", "candlestick"],
  ["grimoire", "grimoire"],
  ["talisman", "talisman"],
  ["musicBox", "music box"],
  ["rubyRing", "ravenblood ring"],
  ["goldLocket", "gold locket"],
  ["ancientCoin", "ancient coin"],
  ["crystalDecanter", "crystal decanter"],
  ["ancestralPortrait", "ancestral portrait"],
  ["backwardsWatch", "woodblack watch"],
];

const HEIRLOOM_LORE = {
  spyglass: "A handsome brass spyglass etched BM, forever aimed from its rusted swivel cradle at the manor's distant belfry.",
  batSightMirror: "A silver hand-mirror embossed with tiny bats and the initials BM. Its black glass can spy into any room in Blackwood Manor.",
  familyCrest: "The Blackwood family crest, resting on velvet beside the hoard — the proof and pride of a cursed bloodline.",
  candlestick: "A tarnished silver candlestick, heavy and fine, its candle miraculously unburnt after all these years.",
  grimoire: "A heavy black grimoire clasped in tarnished silver — a priceless first edition. Some things are worth money, not reading.",
  talisman: "A silver talisman, warm to the touch, graven with wards against the dead and stamped with the BM crest.",
  musicBox: "A jeweled music box, its lid inlaid with mother-of-pearl. Wind it and it still remembers a lullaby no one living taught it.",
  rubyRing: "The Ravenblood Ring — a heavy gold band set with a garnet like a suspended drop of blood, initialed BM inside.",
  goldLocket: "A gold locket, cold as the grave, its clasp shaped like two clasped hands that will not let go.",
  ancientCoin: "An ancient coin worn smooth, stamped with a face no one alive remembers — and no one dead will name.",
  crystalDecanter: "A cut-crystal decanter, still full, throwing splinters of colour even in the manor's deepest gloom.",
  ancestralPortrait: "A miniature portrait of a woman who looks unsettlingly like the garden statue. Her painted gaze follows you across the room.",
  backwardsWatch: "A tarnished Woodblack Watch with no hands or hours — only a single changing number. On the back: \u201CWhat time takes, blood remembers.\u201D",
};

const SEEN_KEY = "blackwood-howto-seen-v1";

export function initHowto(opts = {}) {
  const {
    iconBase = "icons/",
    currentMode = "2d",
    autoOpen = true,
    onEnter = null,
    onTour = null,
    onSwitchText = null,
    onSwitch2d = null,
    modeSwitchSel = "#top-controls",
  } = opts;
  const ib = iconBase.endsWith("/") ? iconBase : iconBase + "/";

  const overlay = document.createElement("div");
  overlay.className = "howto-overlay";
  overlay.id = "howtoOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "How to play Blackwood Manor");
  overlay.innerHTML = `
    <div class="howto-card">
      <button class="howto-close" id="howtoClose" type="button" aria-label="close">\u00D7</button>
      <div class="howto-hero">
        <img class="bg" src="${ib}manor_banner.png" alt="Blackwood Manor at night" />
        <img class="gary" src="${ib}gary.png" alt="Gary the ghost" />
        <div class="cap">
          <h2>BLACKWOOD MANOR</h2>
          <p>Thirteen heirlooms. One cursed clock. One restless ghost.</p>
        </div>
      </div>
      <div class="howto-body">
        <p>You are <b>Gary</b> — dead, but not gone. Bound to the manor you once
        explored in life, you drift its fog-drowned halls where <b>thirteen lost
        Blackwood heirlooms</b> still wait in the dark. Find them. Carry them home.
        Make the house whole again\u2026 before it makes <i>you</i> part of it.</p>

        <div class="howto-goal">
          <span class="g-ic"><img src="${ib}clockTalisman.png" alt="Countdown clock" /></span>
          <div>
            <p style="margin:0"><b>Your quest:</b> enshrine all thirteen relics in the
            Reliquary's recesses. Set the last one in place and they fuse into the
            <b>Countdown Clock</b> \u2014 and the manor tolls its <b>thirteenth hour</b>.</p>
          </div>
        </div>

        <h3>Two ways to play</h3>
        <div class="howto-modes">
          <div class="howto-mode" data-switch="text" role="button" tabindex="0"
            title="Play in Text mode">
            <h4>\uD83D\uDCDC Text mode <span class="go">${currentMode === "text" ? "you\u2019re here" : "switch \u2192"}</span></h4>
            <p>Old-school adventure. <b>Type what Gary does</b> \u2014 "go library", "take
            locket", "drop bait" \u2014 or tap the arrows. Read the room. Trust your gut.</p>
          </div>
          <div class="howto-mode" data-switch="2d" role="button" tabindex="0"
            title="Play the 2D map">
            <h4>\uD83D\uDDFA\uFE0F 2D map mode <span class="go">${currentMode === "2d" ? "you\u2019re here" : "switch \u2192"}</span></h4>
            <p>The manor paints itself in 8-bit as you step into each room; everywhere
            you haven't been stays lost in fog. <b>Click a room to walk there</b>, use
            arrow keys / WASD, or hit <kbd>\u25B6 auto-tour</kbd>.</p>
          </div>
        </div>

        <h3>The thirteen heirlooms</h3>
        <p>Hunt down every one. They ride in your <b>Carrying</b> satchel, then slide
        into the Reliquary the moment they're enshrined. <b>Hover (or tap) any relic for its story.</b></p>
        <div class="howto-gallery" id="howtoGallery"></div>

        <h3>The Reliquary</h3>
        <div class="howto-reliquary">
          <div class="howto-shrine">
            <img src="${ib}reliquary.png" alt="Reliquary, closed" />
            <span class="nm">Reliquary</span>
            <span class="sub">Thirteen empty recesses await</span>
          </div>
          <div class="howto-shrine">
            <img src="${ib}reliquary_open.png" alt="Reliquary, open" />
            <span class="nm">All 13 enshrined</span>
            <span class="sub">The cabinet groans open</span>
          </div>
          <div class="howto-shrine reward">
            <img src="${ib}clockTalisman.png" alt="Countdown clock" />
            <span class="nm">Countdown Clock</span>
            <span class="sub">The fused reward \u00B7 one hand on XIII</span>
          </div>
        </div>

        <div class="howto-cta">
          <button type="button" id="howtoPlay" class="cta-primary">\u25B6 Enter the manor</button>
          <button type="button" id="howtoTour" class="cta-ghost">\uD83C\uDFAC Watch a tour</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const card = overlay.querySelector(".howto-card");
  const gallery = overlay.querySelector("#howtoGallery");

  // --- floating heirloom backstory popover ---
  let lorePop = null, loreActiveItem = null;
  function hideLore() {
    if (lorePop) lorePop.classList.remove("show");
    if (loreActiveItem) loreActiveItem.classList.remove("active");
    loreActiveItem = null;
  }
  function showLore(item, id, label, toggle = true) {
    if (toggle && loreActiveItem === item) { hideLore(); return; }
    if (loreActiveItem === item && lorePop && lorePop.classList.contains("show")) return;
    if (!lorePop) {
      lorePop = document.createElement("div");
      lorePop.className = "lore-pop";
      document.body.appendChild(lorePop);
      lorePop.addEventListener("click", (e) => {
        if (e.target.classList.contains("lp-x")) hideLore();
      });
    }
    lorePop.innerHTML =
      `<button class="lp-x" type="button" aria-label="close">\u00D7</button>` +
      `<div class="lp-head"><img src="${ib}heirlooms/${id}.png" alt="">` +
      `<span class="lp-nm">${label}</span></div>` +
      `<p class="lp-body">${HEIRLOOM_LORE[id] || "A lost Blackwood heirloom."}</p>`;
    const r = item.getBoundingClientRect();
    lorePop.style.visibility = "hidden";
    lorePop.classList.add("show");
    const pw = lorePop.offsetWidth, ph = lorePop.offsetHeight;
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    let top = r.bottom + 8;
    if (top + ph > window.innerHeight - 12) top = r.top - ph - 8;
    lorePop.style.left = left + "px";
    lorePop.style.top = Math.max(12, top) + "px";
    lorePop.style.visibility = "";
    if (loreActiveItem) loreActiveItem.classList.remove("active");
    loreActiveItem = item; item.classList.add("active");
  }

  // --- gallery ---
  let i = 0;
  for (const [id, label] of HEIRLOOMS) {
    const item = document.createElement("div");
    item.className = "howto-item";
    item.style.animationDelay = `${0.04 * i++}s`;
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.title = `${label} \u2014 hover to read its story`;
    const img = document.createElement("img");
    img.src = `${ib}heirlooms/${id}.png`;
    img.alt = label; img.loading = "lazy";
    const nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = label;
    item.append(img, nm);
    // Hover reveals the backstory; click/keyboard still work for touch + a11y.
    item.addEventListener("mouseenter", () => showLore(item, id, label, false));
    item.addEventListener("mouseleave", hideLore);
    item.addEventListener("click", (e) => { e.stopPropagation(); showLore(item, id, label); });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showLore(item, id, label); }
    });
    gallery.appendChild(item);
  }

  // --- open / close ---
  function open() { overlay.classList.add("open"); }
  function close() {
    hideLore();
    overlay.classList.remove("open");
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ }
  }

  // --- mode cards: the current mode closes; the other switches ---
  overlay.querySelectorAll(".howto-mode[data-switch]").forEach((cardEl) => {
    const go = () => {
      const mode = cardEl.getAttribute("data-switch");
      if (mode === currentMode) { close(); return; }
      if (mode === "text") { (onSwitchText || close)(); }
      else { (onSwitch2d || close)(); }
    };
    cardEl.addEventListener("click", go);
    cardEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });

  overlay.querySelector("#howtoClose").addEventListener("click", close);
  overlay.querySelector("#howtoPlay").addEventListener("click", () => {
    close();
    if (typeof onEnter === "function") onEnter();
  });
  overlay.querySelector("#howtoTour").addEventListener("click", () => {
    if (typeof onTour === "function") onTour(); else close();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) { close(); return; }
    if (loreActiveItem && !e.target.closest(".howto-item")) hideLore();
  });
  if (card) card.addEventListener("scroll", hideLore, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (loreActiveItem) hideLore(); else if (overlay.classList.contains("open")) close(); }
  });

  // --- tutorial button in the page-level controls ---
  // Prefer a static button already in the markup (robust against timing); only
  // create one as a fallback.
  let btn = document.getElementById("howtoBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "howtoBtn";
    btn.className = "howto-btn";
    btn.title = "How to play";
    btn.setAttribute("aria-label", "How to play");
    btn.textContent = "\uD83D\uDCD6 How to play";
    const modeSwitch = document.querySelector(modeSwitchSel);
    if (modeSwitch) modeSwitch.insertBefore(btn, modeSwitch.firstChild);
    else document.body.appendChild(btn);
  }
  btn.addEventListener("click", open);

  // First-time visitors get the tutorial automatically.
  if (autoOpen) {
    try { if (!localStorage.getItem(SEEN_KEY)) open(); }
    catch { /* private mode — just don't auto-open */ }
  }

  return { open, close };
}
