#!/usr/bin/env bash
# Joins the rendered parts (A intro, B, C, D outro), muxes the −14 LUFS mix → renders/nahzat-ur.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
P=renders/parts
printf "file 'A.mp4'\nfile 'B.mp4'\nfile 'C.mp4'\nfile 'D.mp4'\n" > $P/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $P/list.txt -c copy $P/silent.mp4
ffmpeg -v error -y -i $P/silent.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart renders/nahzat-ur.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 renders/nahzat-ur.mp4
