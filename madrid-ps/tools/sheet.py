# python3 tools/sheet.py out.jpg t1 t2 ... → stills (via still.mjs) tiled with time labels
import sys, subprocess, glob, os, shutil
from PIL import Image, ImageDraw
out, ts = sys.argv[1], sys.argv[2:]
d = '/tmp/claude-0/-home-user-example-video/f6bae146-e299-5b68-9d3c-f23d166acc06/scratchpad/st_sheet'
shutil.rmtree(d, ignore_errors=True)
subprocess.run(['node', 'tools/still.mjs', d, *ts], check=True)
fs = sorted(glob.glob(d + '/t*.png'))
cols = min(6, len(fs)); rows = (len(fs) + cols - 1) // cols
W, H = 324, 576
c = Image.new('RGB', (cols * W, rows * (H + 24)), 'white'); dr = ImageDraw.Draw(c)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    c.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 24))
    dr.text((x + 6, y + 4), os.path.basename(f)[1:-4], fill='black')
c.save(out, quality=88)
