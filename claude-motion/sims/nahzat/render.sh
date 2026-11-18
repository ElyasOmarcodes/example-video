#!/usr/bin/env bash
# Full render: 3 capture processes in parallel (frame-exact chunks), concat, mux with the score at -14 LUFS.
set -euo pipefail
cd "$(dirname "$0")/../.."
export CHROMIUM=${CHROMIUM:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
node sims/build.mjs nahzat
python3 sims/nahzat/sound.py
D=$(python3 -c "import json;print(json.load(open('sims/nahzat/timeline.json'))['duration'])")
OUT=out/sims/nahzat; mkdir -p $OUT
CUTS=(0 75 150 $D)
for i in 0 1 2; do
  node sims/capture.mjs nahzat --size 1080x1920 --dpr 1 --fps 30 --crf 18 --from ${CUTS[$i]} --to ${CUTS[$((i+1))]} --out $OUT/part$i.mp4 > $OUT/part$i.log 2>&1 &
done
wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\n" > $OUT/parts.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i $OUT/parts.txt -c copy $OUT/silent.mp4
ffmpeg -loglevel error -y -i $OUT/silent.mp4 -i $OUT/sound.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart $OUT/nahzat-ep1.mp4
echo DONE
