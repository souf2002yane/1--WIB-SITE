"""Shrink every JPG/PNG/WEBP in a folder to <200 KB (needs: pip install pillow).
Usage: python3 tools/compress_images.py IMAGES
Originals are kept in IMAGES/_originals."""
import os, shutil, sys
from PIL import Image

folder = sys.argv[1] if len(sys.argv) > 1 else "IMAGES"
limit = 200 * 1024
backup = os.path.join(folder, "_originals")
os.makedirs(backup, exist_ok=True)
for name in sorted(os.listdir(folder)):
    path = os.path.join(folder, name)
    ext = name.lower().rsplit(".", 1)[-1]
    if not os.path.isfile(path) or ext not in ("jpg", "jpeg", "png", "webp"):
        continue
    if os.path.getsize(path) <= limit:
        continue
    shutil.copy2(path, os.path.join(backup, name))
    img = Image.open(path)
    img.thumbnail((1600, 1600))
    if ext in ("jpg", "jpeg"):
        img = img.convert("RGB")
    for q in (85, 78, 70, 62, 55, 48):
        img.save(path, quality=q, optimize=True)
        if os.path.getsize(path) <= limit:
            break
    if os.path.getsize(path) > limit:
        img.thumbnail((1200, 1200)); img.save(path, quality=50, optimize=True)
    print(name, os.path.getsize(path) // 1024, "KB")
