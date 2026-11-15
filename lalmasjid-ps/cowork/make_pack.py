"""Writes cowork/PROMPT.md (English brief for Claude Cowork) from shots.json, and stages pack files."""
import json, os, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, 'renders', 'shots')
PK = os.path.join(ROOT, 'cowork', 'pack')
shots = json.load(open(os.path.join(SH, 'shots.json')))

LOOK = 'Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks.'
SCENE = {
 's01': ('A1,A4,A2', 'Aerial night view of the red-brick Lal Masjid complex (golden dome, two slender red minarets, madrasa wing) in the middle of dense Islamabad city blocks, encircled by a ring of olive military armored vehicles, white searchlight beams in haze, sodium street lights.'),
 's02': ('A6', 'Photoreal 3D satellite relief map of Pakistan from a low oblique angle: snowy Himalaya-Karakoram north, Indus plain, south-west desert, Arabian Sea; Pakistan border a thin glowing gold line, neighbours darker; a golden light pillar rises from Islamabad with a soft ground ring pulse.'),
 's03': ('A1,A2,A3', 'Ground-level night standoff: olive armored vehicles and helmeted soldier silhouettes in foreground, the red-walled mosque with golden dome and red minarets in the distance, windows glowing, searchlight beam, drifting smoke.'),
 's04': ('A5', 'Dark museum studio, polished dark round pedestal with thin gold rim under a top spotlight, an ornate wooden frame with a faded sepia archival photo of a 1980s military parade with tanks (no recognisable faces), dust in the beam.'),
 's05': ('A5', 'Dark museum studio, two pedestals with gold rims, each holding an anonymous black silhouette bust of a bearded man in a turban, backlit by orange rim light, faces fully in shadow and unrecognisable.'),
 's06': ('A5', 'Dark museum studio, a row of four small pedestals under narrow warm spotlights: a stack of old library books, a police peaked cap, a steel chain, a wooden judge gavel; reflective floor, haze.'),
 's07': ('A6', 'Satellite relief map at night: Pakistan gold, China tinted dark red, a glowing red-orange dotted arc from Islamabad over the Himalaya to Beijing, city lights, thin clouds.'),
 's08': ('A1,A3', 'The red-walled mosque at night during an armed clash: orange muzzle flashes and fire bursts along the compound walls, tracer streaks, thick smoke lit orange; no close-up people, no gore.'),
 's09': ('A3', 'Night cordon of concrete barriers on an empty street, out-of-focus soldier silhouettes in the foreground, a lone figure fully covered in a dark-blue burqa walking toward the cordon in a hard white searchlight, fire glow behind; no faces.'),
 's10': ('A1,A3', 'Commando silhouettes advancing in a line toward the red-walled mosque, a large explosion fireball and smoke from the compound lighting everything orange, debris and dust; no gore.'),
 's11': ('A7', 'Empty madrasa classroom after the siege: smoke-stained plaster walls, deep red carpet, rows of small wooden Quran stands, abandoned sandals, dust in shafts of daylight from a side window; no people.'),
 's12': ('A5', 'Dark museum studio, three pedestals with gold rims, the middle taller, each with a stack of blank case files bound with string under narrow warm spotlights; no readable text.'),
 's13': ('A8', 'Low angle on a grand white marble supreme court building: wide steps, tall columns, triangular pediment, overcast late-afternoon light, a Pakistani flag, a few small distant figures; no readable text.'),
 's14': ('A1', 'Dawn after the siege: the red-walled mosque with golden dome and two red minarets seen from an empty street, walls scarred with bullet marks and soot, pink-gold sunrise haze, birds over the dome, an abandoned sandal on the road.'),
}
MOVE = {'push': 'slow dolly push-in', 'pull': 'slow dolly pull-back', 'orbitL': 'slow orbit to the left around the subject', 'orbitR': 'slow orbit to the right around the subject',
        'crane': 'slow crane up while tilting down', 'truck': 'slow lateral tracking move', 'descend': 'descending drone move from high and far down to the subject'}
ASSETS = [
 ('A1', 'Texture & look sheet of the Lal Masjid complex: weathered deep red brick and red plaster walls, white marble trim, a golden dome with patina, two slender red minarets with white balconies and gold finials. Show a hero 3/4 view plus close-up swatches of brick, plaster, marble and dome metal. Neutral overcast light.'),
 ('A2', 'Look sheet of a Pakistani olive-green 8-wheeled armored personnel carrier (2000s), side and 3/4 views, dusty paint, roof hatch; plus close-up texture swatches of the painted steel and tyres.'),
 ('A3', 'Look sheet of Pakistani special forces commandos (2007) in dark fatigues, helmets, tactical vests, rifles, shown as silhouettes and full-body back views only, no visible faces; plus fabric and gear texture swatches.'),
 ('A4', 'Look sheet of Islamabad city at night: 4-6 storey concrete apartment and office blocks, sodium street lights, wide avenues with trees, Margalla hills dark in the background; plus facade texture swatches.'),
 ('A5', 'Look sheet of a dark museum studio: seamless charcoal cyclorama, polished dark metal round pedestals with a thin brushed-gold rim, narrow warm theatrical spotlights in haze, reflective floor.'),
 ('A6', 'Look sheet of a photoreal satellite relief texture of Pakistan and neighbours: snowy Karakoram peaks, Indus plain farmland, Balochistan desert, coastline, with a glowing thin gold border line style.'),
 ('A7', 'Look sheet of a madrasa classroom interior: lime-plaster walls with soot stains, deep red patterned carpet, small folding wooden Quran stands (rehal), worn sandals; texture swatches.'),
 ('A8', 'Look sheet of a white marble neoclassical supreme court building: column, capital, steps and pediment details, marble texture swatches, overcast light.'),
]

os.makedirs(os.path.join(PK, 'motion'), exist_ok=True)
os.makedirs(os.path.join(PK, 'first'), exist_ok=True)
os.makedirs(os.path.join(PK, 'plates'), exist_ok=True)
for n in range(1, 15):
    shutil.copy(os.path.join(ROOT, 'public', 'img', f's{n:02d}.jpg'), os.path.join(PK, 'plates', f's{n:02d}.jpg'))
for s in shots:
    src = os.path.join(SH, s['id'])
    if not os.path.isdir(src): continue
    mp4 = os.path.join(PK, 'motion', s['id'] + '.mp4')
    if not os.path.exists(mp4):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '6', '-i', os.path.join(src, 'f_%04d.jpg'),
                        '-vf', "scale=576:1024:flags=lanczos,minterpolate=fps=24:mi_mode=blend", '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', mp4], check=True)
    shutil.copy(os.path.join(src, 'f_0001.jpg'), os.path.join(PK, 'first', s['id'] + '.jpg'))

L = []
w = L.append
w('# Lal Masjid film: Higgsfield generation brief (for Claude Cowork)\n')
w('You are generating moving, photoreal video clips for a Pashto documentary. All motion and camera work is already designed in Blender; your job is to turn each Blender motion clip into a photoreal clip with Higgsfield, **using the free unlimited allowance only**.\n')
w('## Hard rules\n')
w('1. Every Higgsfield generation call MUST pass `use_unlim: true`. If an unlimited request is rejected, STOP and tell me. Never fall back to credits.')
w('2. Upload the attached files with `media_upload` and `media_confirm` (type image or video) before using them; keep a table filename → media_id.')
w('3. Never render text, captions, logos or watermarks into images or videos. No gore and no recognisable faces of real people.')
w('4. Work in batches of at most 12 jobs (`generate_image_batch` / `generate_video_batch`), then `jobs_wait`. Keep a checklist in `progress.md` so you can resume if the session stops.')
w('5. Download every finished clip and name it exactly `<shot id>.mp4` (for example `L04_2.mp4`). At the end, zip all clips as `lalmasjid-clips.zip` and give it to me.\n')
w('## Attached files\n')
w('- `motion/<shot>.mp4`: Blender camera-motion reference for each shot (grey blockout, 9:16).')
w('- `first/<shot>.jpg`: first frame of that Blender shot.')
w('- `plates/sNN.jpg`: approved photoreal style frames for each of the 14 sets (keep this look).\n')
w('## Step 1: asset look sheets (8 images)\n')
w('Model `nano_banana_pro`, `resolution: 2k`, `aspect_ratio: 1:1`, `use_unlim: true`. Name results A1…A8.\n')
w('| ID | Prompt |\n|---|---|')
for a, p in ASSETS: w(f'| {a} | {p} {LOOK} |')
w('\n## Step 2: start frame for each shot\n')
w('Model `nano_banana_pro`, `resolution: 2k`, `aspect_ratio: 9:16`, `use_unlim: true`.')
w('`medias` (all role `image_references`), in this order: `first/<shot>.jpg` (composition and camera angle; match it exactly), `plates/<set>.jpg` (approved look), then the listed asset sheets.')
w('Prompt: `Photoreal re-render of reference image 1, keeping its exact camera angle, framing and object layout. ` + the set description + the LOOK line.\n')
w('## Step 3: the moving clip for each shot\n')
w('Model `seedance_2_5`, `mode: omni_reference`, `resolution: 720p`, `aspect_ratio: 9:16`, `generate_audio: false`, `use_unlim: true`, `duration` = the value in the table.')
w('`medias`: role `start_image` = the Step 2 job for this shot; role `video_references` = `motion/<shot>.mp4`; role `image_references` = `plates/<set>.jpg`.')
w('Prompt: `Follow the exact camera motion and timing of the reference video (<move>). Photoreal, keep every object consistent with the start image; subtle natural motion only (smoke drift, flickering light, dust, flags). ` + the set description + the LOOK line.\n')
w(f'LOOK line: `{LOOK}`\n')
w('## Set descriptions\n')
w('| Set | Assets | Description |\n|---|---|---|')
for k, (a, d) in SCENE.items(): w(f'| {k} | {a} | {d} |')
w(f'\n## Shot list ({len(shots)} shots)\n')
w('| Shot | Set | Camera move | duration (s) |\n|---|---|---|---|')
for s in shots: w(f"| {s['id']} | {s['scene']} | {MOVE[s['move']]} | {s['gen_dur']} |")
w('\n## When finished\n')
w('Give me `lalmasjid-clips.zip` (all `<shot>.mp4`) plus `A1…A8` and the start frames, and report any shot that failed.')
open(os.path.join(ROOT, 'cowork', 'PROMPT.md'), 'w').write('\n'.join(L) + '\n')
print('written', len(shots), 'shots;', len(os.listdir(os.path.join(PK, 'motion'))), 'motion clips staged')
