import sys, glob, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(f"{src}/*.png")); W, H, cols = 576, 360, 5; rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, (H + 20) * rows), (30, 20, 15)); d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((W, H)); x = (i % cols) * W; y = (i // cols) * (H + 20)
    sheet.paste(im, (x, y + 20)); d.text((x + 6, y + 3), os.path.basename(f)[:-4], fill=(240, 220, 170))
sheet.save(out)
