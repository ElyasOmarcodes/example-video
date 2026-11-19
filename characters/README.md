# Nahzat characters — President (2001) and General (2001)

Realistic, rigged 3D characters for the next Nahzat video. Built headless with Blender 5.3 (bpy) + three.js.

| | |
|---|---|
| Body | MakeHuman base mesh + 1477 targets (CC0, MPFB2 data) — own loader, no MPFB code |
| Skeleton | 163 bones (default MakeHuman rig) with real skin weights; relaxed stance baked as rest pose |
| Face | 10 expression shape keys (blink L/R, mouth open, smile, brows up/down …) |
| Skin | Cycles SSS (random-walk skin), MakeHuman region masks, Higgsfield pore detail, stubble shadow |
| Eyes | eyeball with cornea bulge, Higgsfield iris, wet coat |
| Hair | own groomer: strands planted on the real scalp faces, combed, projected on the skull, clumped; brows, lashes, mustache |
| Clothes | tailored from the body (ease, smoothing, straight jacket back, shoulder pads), lapels, collars, tie, shoes on a parametric last; general: pockets, ribbons, rank boards, collar tabs, belt, peaked cap |
| Textures | 13 Higgsfield images (9.5 credits): wool, cotton, silk, khaki, leathers, skin pores, irises, insignia |

Build:
```
python3 characters/build/build_body.py           # bodies + rigs  → out/<id>_body.blend
python3 characters/build/build_char.py <id>       # look + clothes → out/<id>_char.blend
python3 characters/build/render_sheet.py <id>     # Cycles turnarounds/details → out/sheets/<id>/
python3 characters/build/export_glb.py <id>       # three.js GLB → out/glb/<id>.glb
```
three.js check: `characters/viewer/` (bundle with `node build.mjs`, serve `characters/`, open `viewer/index.html`).
