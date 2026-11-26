# Hindukush — «له اسلام آباده تر مادریده»

Light motion-graphics explainer (1080×1920, 30 fps) in the style of the reference clip in the brief: cream
backdrop, soft glow, one bold Al-Quds headline per beat, white cards and clay icons that morph and drift.

- Narration `audio/voice.mp3` (news_studio_strong). `tools/transcribe.py` (faster-whisper large-v3-turbo) →
  `tools/align.py` (character alignment of `data/script.txt`) → `data/words.json`.
- `data/beats.txt` — every on-screen beat: an anchor (the script words where it starts) and its headline,
  only words from the script. `tools/beats.py` → `data/timeline.json`.
- `web/` — one page whose `SIM.render(t)` is a pure function of time: `src/film.js` (backdrop, motes,
  headlines with kashida justification, kicker, Hindukush logo sting and end card), `src/kit.js` (items,
  morphing shapes, lists, chips, clay icons with ambient glow/satellites), `src/map.js` (dot-matrix map from
  Natural Earth, `tools/map_prep.py`), `src/scenes.js` (all sections).
- Type: Al-Quds only — Black for headlines, Bold thinned with a surface-coloured hairline for everything else.
- Icons: Higgsfield GPT Image 2.6 (transparent PNG), prompts in `data/images.json`. Score: Higgsfield
  ElevenLabs Music v2.5 (`audio/score.mp3`).
- Sound: `tools/cues.mjs` dumps the cue registry → `tools/sound.py` mixes voice + levelled, ducked score +
  soft effects to −14 LUFS.
- Render: `.github/workflows/madrid-render.yml`, started by a push to `render.request`: the whole film in ONE
  continuous capture (`tools/capture.mjs`), muxed once, plus a HandBrake H.265 copy (`tools/handbrake.sh`).
