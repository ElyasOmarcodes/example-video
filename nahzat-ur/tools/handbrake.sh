#!/usr/bin/env bash
# Small delivery copy with HandBrakeCLI: H.265 (8-bit Main, plays everywhere), constant quality RF 25,
# tuned for animation (flat colours, sharp type), 30 fps constant, AAC 128k stereo, web-optimised.
set -euo pipefail
IN=${1:-renders/nahzat-ur.mp4}; OUT=${2:-renders/nahzat-ur-small.mp4}
HandBrakeCLI -i "$IN" -o "$OUT" -e x265 -q 25 --encoder-preset medium --encoder-tune animation \
  --cfr --rate 30 -E av_aac -B 128 --mixdown stereo --optimize 2>&1 | grep -E "Encode done|error|Error" || true
ls -la "$OUT"
