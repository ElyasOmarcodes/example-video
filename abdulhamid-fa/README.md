# عبدالحمید دوم — قسمت ۱: آخرین روز در یلدز

Persian documentary short in the style of the user's reference reel: white clay figures in lit sets, word-by-word captions, maps, quote cards, and a part-2 teaser. Made with the OpenMontage workflow (research → script → characters/prompts → assets → compose).

- `openmontage/artifacts/`: research_brief.json (Wikipedia-sourced facts), characters.json, script.json, prompts.json, timeline.json
- Images: SDXL-Turbo through OpenMontage `tools/graphics/local_diffusion.py` (`tools/gen.py`, CPU bf16), then a white-clay pass: person segmentation `tools/clay.py` plus skin-tone whitening `tools/skin.py`
- Voice: Piper `fa_IR-ganji-medium` (local, free)
- Map: Natural Earth 1:50m country shapes (public domain)
- Music: "Silent Descent" (Mixkit, Mixkit Free License). SFX: Mixkit, plus the user's map-draw sound
- Font: Vazirmatn (OFL)
- Composition: HyperFrames (`tools/build.py` + `tools/template.html` → `index.html`); audio: `tools/audio_mix.py`

## v2: animated 3D (Three.js)
- `lib/world.js`: every shot is a real-time 3D scene (Three.js r170) drawn from timeline time (`hf-seek`). Rigged, animated human figures use `models/Xbot.glb` (Mixamo rig, from the three.js examples) in white clay, with added fez, beard, robe, rifle and lantern. Animations: walk, idle, agree, headShake, plus bone-driven sitting, arm raising and bowing. Sets are procedural: Yildiz office, station and trains, corridor, Salonica square, mosque, street, parliament hall, delegation room.
- The Sultan's close-ups come from his real 1907 likeness (`openmontage/ref_abdulhamid_1907.jpg`, public domain). Pipeline: SDXL-Turbo img2img into a plaster bust (`tools/bust.py`), clay pass, then Depth-Anything-V2 depth (`tools/depth.py`). The bust is displaced into a 3D relief, and the camera orbits it.
