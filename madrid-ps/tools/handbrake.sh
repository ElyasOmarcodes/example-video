#!/usr/bin/env bash
# Delivery copy with HandBrakeCLI: H.265 (8-bit Main, plays everywhere), constant quality RF 21 with the
# slow preset — visually lossless for this flat, soft-gradient look — 30 fps constant, AAC 192k stereo, web-optimised.
set -euo pipefail
IN=${1:-renders/madrid.mp4}; OUT=${2:-renders/madrid-small.mp4}
HandBrakeCLI -i "$IN" -o "$OUT" -e x265 -q 21 --encoder-preset slow \
  --cfr --rate 30 -E av_aac -B 192 --mixdown stereo --optimize 2>&1 | grep -E "Encode done|error|Error" || true
ls -la "$OUT"
