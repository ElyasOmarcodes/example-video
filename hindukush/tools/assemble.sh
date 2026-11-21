#!/usr/bin/env bash
# Joins the cached scene segments (in order, frame-exact) and encodes the film ONCE with the mix.
# usage: bash tools/assemble.sh renders/cache renders/hindukush.mp4
set -euo pipefail
CACHE=${1:-renders/cache}; OUT=${2:-renders/hindukush.mp4}
python3 - "$CACHE" > "$CACHE/list.txt" <<'PY'
import json, sys, os
m = json.load(open(os.path.join(sys.argv[1], 'manifest.json')))
for s in m['segments']:
    print(f"file '{os.path.abspath(os.path.join(sys.argv[1], s['file']))}'")
PY
ffmpeg -v error -y -f concat -safe 0 -i "$CACHE/list.txt" -i audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 15 -maxrate 18M -bufsize 30M -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,r_frame_rate -of csv=p=0 "$OUT"
