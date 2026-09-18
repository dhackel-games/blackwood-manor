#!/usr/bin/env python3
"""Generate the 13 Blackwood heirloom icons + the reliquary icon via Adobe
Firefly Services, then key out the flat background to transparent PNGs that
drop straight into web/view2d/icons/.

WHY THIS EXISTS
  The 2D collection tray (web/view2d/tilemap.html) shows an emoji for each
  heirloom until a matching PNG exists at:
      web/view2d/icons/heirlooms/<id>.png     (13 heirlooms)
      web/view2d/icons/reliquary.png           (the cabinet)
  This script produces exactly those files. The tray auto-swaps emoji -> PNG.

AUTH (Adobe Firefly Services — https://firefly-api.adobe.io)
  Provide EITHER a client id/secret (a token is minted for you) OR a ready
  IMS access token. The client id doubles as the required x-api-key header.

    export FIREFLY_CLIENT_ID=...           # also used as x-api-key
    export FIREFLY_CLIENT_SECRET=...       # exchanged for an IMS token
      -- or --
    export FIREFLY_ACCESS_TOKEN=...        # a ready bearer token
    export FIREFLY_CLIENT_ID=...           # still needed for x-api-key

USAGE
    python web/tools/gen-firefly-icons.py                 # all 14
    python web/tools/gen-firefly-icons.py spyglass talisman   # a subset
    python web/tools/gen-firefly-icons.py --keep-raw      # also save the raw
                                                          # Firefly render

NOTE
  Firefly image generation renders on a filled background (no native alpha),
  so we prompt for a flat chroma-green field (#00B140) and remove it locally.
  Green is chosen because none of these gothic gold/silver/red/purple objects
  use it. Tune CHROMA_TOLERANCE if edges look rough.
"""

import argparse
import io
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("This script needs Pillow:  pip install Pillow  (or: uv pip install Pillow)")

IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3"
GENERATE_URL = "https://firefly-api.adobe.io/v3/images/generate"
IMS_SCOPE = "openid,AdobeID,firefly_api,ff_apis"

# Chroma-key background: a flat green Firefly won't put in the subject.
CHROMA = (0x00, 0xB1, 0x40)
CHROMA_TOLERANCE = 90          # 0-441; higher removes more green-ish pixels
OUT_SIZE = 256                 # final square icon size (pixelated downscale)

REPO = Path(__file__).resolve().parents[1]          # .../web
ICON_DIR = REPO / "view2d" / "icons"
HEIRLOOM_DIR = ICON_DIR / "heirlooms"

STYLE = (
    "8-bit 16-bit pixel-art video game sprite, chunky visible pixels, crisp 1px "
    "dark outline, flat cel shading with a top-left light source. A single gothic "
    "haunted-manor treasure rendered in a muted palette of dusty purple, cold grey, "
    "aged brass and gold, and deep jewel tones. Retro RPG inventory icon, object "
    "centered and filling most of the frame, front three-quarter view. The object "
    "sits completely alone on a perfectly flat solid chroma-green background, color "
    "hex #00B140, with no gradient, no shadow, no reflection, no text, and no scenery."
)

# (icon key, output relative path, subject)
ICONS = [
    ("spyglass",          "heirlooms/spyglass.png",          "a brass telescoping spyglass with the initials B M etched on the barrel"),
    ("batSightMirror",    "heirlooms/batSightMirror.png",    "a silver hand mirror with black glass, its rim embossed with tiny flying bats"),
    ("familyCrest",       "heirlooms/familyCrest.png",       "a blackened-silver heraldic crest showing a raven above crossed keys"),
    ("candlestick",       "heirlooms/candlestick.png",       "a tall tarnished silver candlestick holding one unlit white candle"),
    ("grimoire",          "heirlooms/grimoire.png",          "a heavy black spellbook clasped with tarnished silver corner fittings"),
    ("talisman",          "heirlooms/talisman.png",          "a round silver protective amulet on a chain, engraved with warding runes"),
    ("musicBox",          "heirlooms/musicBox.png",          "a small jeweled music box, its lid inlaid with iridescent mother-of-pearl"),
    ("rubyRing",          "heirlooms/rubyRing.png",          "a heavy gold signet ring set with a dark blood-red garnet gem"),
    ("goldLocket",        "heirlooms/goldLocket.png",        "a gold oval locket whose clasp is shaped like two clasped hands"),
    ("ancientCoin",       "heirlooms/ancientCoin.png",       "a worn round ancient gold coin stamped with a faded weathered face"),
    ("crystalDecanter",   "heirlooms/crystalDecanter.png",   "a faceted cut-crystal decanter full of dark red wine"),
    ("ancestralPortrait", "heirlooms/ancestralPortrait.png", "a small oval portrait miniature of a pale woman in an ornate gilt frame"),
    ("backwardsWatch",    "heirlooms/backwardsWatch.png",    "a tarnished brass pocket watch whose face has no hands, only one glowing number"),
    ("reliquary",         "reliquary.png",                   "a tall glass-fronted gothic stone cabinet with carved doors and thirteen small recessed shelves"),
]


def die(msg):
    sys.exit(f"error: {msg}")


def get_access_token():
    token = os.environ.get("FIREFLY_ACCESS_TOKEN")
    if token:
        return token
    cid = os.environ.get("FIREFLY_CLIENT_ID")
    secret = os.environ.get("FIREFLY_CLIENT_SECRET")
    if not (cid and secret):
        die("set FIREFLY_ACCESS_TOKEN, or FIREFLY_CLIENT_ID + FIREFLY_CLIENT_SECRET")
    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": cid,
        "client_secret": secret,
        "scope": IMS_SCOPE,
    }).encode()
    req = urllib.request.Request(IMS_TOKEN_URL, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)["access_token"]
    except urllib.error.HTTPError as e:
        die(f"IMS token exchange failed ({e.code}): {e.read().decode(errors='replace')[:400]}")


def generate(prompt, token, api_key):
    body = json.dumps({
        "numVariations": 1,
        "prompt": prompt,
        "size": {"width": 1024, "height": 1024},
        "contentClass": "art",
    }).encode()
    req = urllib.request.Request(GENERATE_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            payload = json.load(r)
    except urllib.error.HTTPError as e:
        die(f"Firefly generate failed ({e.code}): {e.read().decode(errors='replace')[:400]}")
    outputs = payload.get("outputs") or []
    if not outputs:
        die(f"no outputs in Firefly response: {json.dumps(payload)[:300]}")
    img = outputs[0].get("image", {})
    url = img.get("url") or img.get("presignedUrl")
    if not url:
        die(f"no image url in Firefly output: {json.dumps(outputs[0])[:300]}")
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def key_out_and_resize(raw_bytes):
    """Chroma-key the flat green field to transparent, autocrop, downscale."""
    im = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    px = im.load()
    cr, cg, cb = CHROMA
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist = ((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2) ** 0.5
            # also catch green-dominant anti-aliased fringe
            greenish = g > r + 40 and g > b + 40
            if dist <= CHROMA_TOLERANCE or greenish:
                px[x, y] = (r, g, b, 0)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    # square pad
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return canvas.resize((OUT_SIZE, OUT_SIZE), Image.NEAREST)


def main():
    ap = argparse.ArgumentParser(description="Generate Blackwood heirloom icons via Firefly.")
    ap.add_argument("keys", nargs="*", help="icon keys to generate (default: all)")
    ap.add_argument("--keep-raw", action="store_true", help="also save the raw Firefly render next to the icon")
    args = ap.parse_args()

    wanted = set(args.keys) if args.keys else None
    todo = [i for i in ICONS if wanted is None or i[0] in wanted]
    if wanted:
        missing = wanted - {i[0] for i in ICONS}
        if missing:
            die(f"unknown icon keys: {', '.join(sorted(missing))}")
    if not todo:
        die("nothing to do")

    api_key = os.environ.get("FIREFLY_CLIENT_ID") or os.environ.get("FIREFLY_API_KEY")
    if not api_key:
        die("FIREFLY_CLIENT_ID (used as x-api-key) is required")
    token = get_access_token()

    HEIRLOOM_DIR.mkdir(parents=True, exist_ok=True)
    for key, rel, subject in todo:
        prompt = f"{STYLE} The object is {subject}."
        print(f"[{key}] generating…", flush=True)
        raw = generate(prompt, token, api_key)
        if args.keep_raw:
            (ICON_DIR / rel).with_suffix(".raw.png").write_bytes(raw)
        icon = key_out_and_resize(raw)
        out = ICON_DIR / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        icon.save(out)
        print(f"[{key}] wrote {out.relative_to(REPO)}")

    print("\nDone. Reload the 2D view — the tray upgrades emoji -> PNG automatically.")


if __name__ == "__main__":
    main()
