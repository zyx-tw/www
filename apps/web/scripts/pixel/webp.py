# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11,<13"]
# ///
"""Turns the pictures drawn by devices.mjs (PNG) into the lossless WebP files /project shows.

Usage (from apps/web): bun run pictures
"""
import sys
from pathlib import Path

from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
for png in sorted(src.glob("*.png")):
    Image.open(png).convert("RGB").save(out / f"{png.stem}.webp", lossless=True, method=6)
    print(png.stem)
