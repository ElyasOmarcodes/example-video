# Hindukush — «له تبلیغاتو تر نیابتي جګړې»

Light motion-graphics explainer (1080×1920, 60 fps) for the Pashto studio narration in `audio/voice.mp3`.

- `data/script.txt` → `tools/align.py` (whisper large-v3-turbo word stamps + character alignment) → `data/timeline.json`
- `web/` — one page whose `SIM.render(t)` is a pure function of time: scenes (`src/scenes.js`), transitions (`src/trans.js`),
  type styles and hero stage (`src/kit.js`), light relief map (`src/map.js`, built by `tools/map_prep.py`), widgets.
- Illustrations: Higgsfield Z Image (prompts in `data/images.json`), cut out by `tools/cutout.py`.
- Sound: `tools/cues.mjs` dumps the cue registry from the page, `tools/sound.py` mixes voice + ElevenLabs score + effects to −14 LUFS.
- Render: `.github/workflows/hindukush-render.yml`, started by a push to `render.request`. One job renders the
  whole film and encodes it once (`tools/render.mjs` + `tools/assemble.sh`). Each scene is kept in the
  `hindukush-cache` release with a fingerprint of every frame's visible state, so after a small edit only the
  scenes that really changed are drawn again. A line `force: P05,P12` (or `force: all`) in `render.request`
  redraws scenes regardless of the cache.
- Type: headlines are laid out as balanced lines and justified with kashida (ـ) after the calligraphic rules
  (`src/kashida.js`) — never with wide gaps between words.
