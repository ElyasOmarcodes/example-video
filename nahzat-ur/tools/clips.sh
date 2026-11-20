#!/usr/bin/env bash
# Rebuilds the page's clip frames from the committed Higgsfield videos and links the character GLBs.
set -euo pipefail
cd "$(dirname "$0")/.."
for v in hf/*_hf.mp4; do
  n=$(basename "$v" .mp4); d=web/assets/clips/$n
  mkdir -p "$d"; ffmpeg -v error -y -i "$v" -q:v 2 "$d/f_%04d.jpg"
  echo "{\"frames\":$(ls "$d"/f_*.jpg | wc -l),\"fps\":24}" > "$d/info.json"
done
ln -sfn ../../../characters/out/glb web/assets/glb
