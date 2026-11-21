# Hindukush — «له تبلیغاتو تر نیابتي جګړې»

Light motion-graphics explainer (1080×1920, 60 fps) for the Pashto studio narration in `audio/voice.mp3`.

- `data/script.txt` → `tools/align.py` (whisper large-v3-turbo word stamps + character alignment) → `data/timeline.json`
- `web/` — one page whose `SIM.render(t)` is a pure function of time: scenes (`src/scenes.js`), transitions (`src/trans.js`),
  type styles and hero stage (`src/kit.js`), light relief map (`src/map.js`, built by `tools/map_prep.py`), widgets.
- Illustrations: Higgsfield Z Image (prompts in `data/images.json`), cut out by `tools/cutout.py`.
- Sound: `tools/cues.mjs` dumps the cue registry from the page, `tools/sound.py` mixes voice + ElevenLabs score + effects to −14 LUFS.
- Render: `.github/workflows/hindukush-render.yml` (12 parallel parts), started by a push to `render.request`.
