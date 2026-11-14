#!/usr/bin/env bash
# voice-over on top, the SFX/bed stem ~11 dB under it, master to -14 LUFS
set -e
ffmpeg -loglevel error -y -i public/vo.mp3 -i public/sfx.wav -filter_complex \
  "[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-2:LRA=11[v];[1:a]aresample=48000,volume=0.28[s];[v][s]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11[o]" \
  -map "[o]" -ar 48000 public/final.wav
echo public/final.wav
