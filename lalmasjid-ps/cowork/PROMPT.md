# Lal Masjid film: Higgsfield generation brief (for Claude Cowork)

You are generating moving, photoreal video clips for a Pashto documentary. All motion and camera work is already designed in Blender; your job is to turn each Blender motion clip into a photoreal clip with Higgsfield, **using the free unlimited allowance only**.

## Hard rules

1. Every Higgsfield generation call MUST pass `use_unlim: true`. If an unlimited request is rejected, STOP and tell me. Never fall back to credits.
2. Upload the attached files with `media_upload` and `media_confirm` (type image or video) before using them; keep a table filename → media_id.
3. Never render text, captions, logos or watermarks into images or videos. No gore and no recognisable faces of real people.
4. Work in batches of at most 12 jobs (`generate_image_batch` / `generate_video_batch`), then `jobs_wait`. Keep a checklist in `progress.md` so you can resume if the session stops.
5. Download every finished clip and name it exactly `<shot id>.mp4` (for example `L04_2.mp4`). At the end, zip all clips as `lalmasjid-clips.zip` and give it to me.

## Attached files

- `motion/<shot>.mp4`: Blender camera-motion reference for each shot (grey blockout, 9:16).
- `first/<shot>.jpg`: first frame of that Blender shot.
- `plates/sNN.jpg`: approved photoreal style frames for each of the 14 sets (keep this look).

## Step 1: asset look sheets (8 images)

Model `nano_banana_pro`, `resolution: 2k`, `aspect_ratio: 1:1`, `use_unlim: true`. Name results A1…A8.

| ID | Prompt |
|---|---|
| A1 | Texture & look sheet of the Lal Masjid complex: weathered deep red brick and red plaster walls, white marble trim, a golden dome with patina, two slender red minarets with white balconies and gold finials. Show a hero 3/4 view plus close-up swatches of brick, plaster, marble and dome metal. Neutral overcast light. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A2 | Look sheet of a Pakistani olive-green 8-wheeled armored personnel carrier (2000s), side and 3/4 views, dusty paint, roof hatch; plus close-up texture swatches of the painted steel and tyres. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A3 | Look sheet of Pakistani special forces commandos (2007) in dark fatigues, helmets, tactical vests, rifles, shown as silhouettes and full-body back views only, no visible faces; plus fabric and gear texture swatches. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A4 | Look sheet of Islamabad city at night: 4-6 storey concrete apartment and office blocks, sodium street lights, wide avenues with trees, Margalla hills dark in the background; plus facade texture swatches. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A5 | Look sheet of a dark museum studio: seamless charcoal cyclorama, polished dark metal round pedestals with a thin brushed-gold rim, narrow warm theatrical spotlights in haze, reflective floor. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A6 | Look sheet of a photoreal satellite relief texture of Pakistan and neighbours: snowy Karakoram peaks, Indus plain farmland, Balochistan desert, coastline, with a glowing thin gold border line style. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A7 | Look sheet of a madrasa classroom interior: lime-plaster walls with soot stains, deep red patterned carpet, small folding wooden Quran stands (rehal), worn sandals; texture swatches. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |
| A8 | Look sheet of a white marble neoclassical supreme court building: column, capital, steps and pediment details, marble texture swatches, overcast light. Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks. |

## Step 2: start frame for each shot

Model `nano_banana_pro`, `resolution: 2k`, `aspect_ratio: 9:16`, `use_unlim: true`.
`medias` (all role `image_references`), in this order: `first/<shot>.jpg` (composition and camera angle; match it exactly), `plates/<set>.jpg` (approved look), then the listed asset sheets.
Prompt: `Photoreal re-render of reference image 1, keeping its exact camera angle, framing and object layout. ` + the set description + the LOOK line.

## Step 3: the moving clip for each shot

Model `seedance_2_5`, `mode: omni_reference`, `resolution: 720p`, `aspect_ratio: 9:16`, `generate_audio: false`, `use_unlim: true`, `duration` = the value in the table.
`medias`: role `start_image` = the Step 2 job for this shot; role `video_references` = `motion/<shot>.mp4`; role `image_references` = `plates/<set>.jpg`.
Prompt: `Follow the exact camera motion and timing of the reference video (<move>). Photoreal, keep every object consistent with the start image; subtle natural motion only (smoke drift, flickering light, dust, flags). ` + the set description + the LOOK line.

LOOK line: `Photoreal cinematic documentary, Islamabad Pakistan July 2007, deep navy night and warm sodium-gold light, haze, film grain, natural lens, no text, no captions, no logos, no watermarks.`

## Set descriptions

| Set | Assets | Description |
|---|---|---|
| s01 | A1,A4,A2 | Aerial night view of the red-brick Lal Masjid complex (golden dome, two slender red minarets, madrasa wing) in the middle of dense Islamabad city blocks, encircled by a ring of olive military armored vehicles, white searchlight beams in haze, sodium street lights. |
| s02 | A6 | Photoreal 3D satellite relief map of Pakistan from a low oblique angle: snowy Himalaya-Karakoram north, Indus plain, south-west desert, Arabian Sea; Pakistan border a thin glowing gold line, neighbours darker; a golden light pillar rises from Islamabad with a soft ground ring pulse. |
| s03 | A1,A2,A3 | Ground-level night standoff: olive armored vehicles and helmeted soldier silhouettes in foreground, the red-walled mosque with golden dome and red minarets in the distance, windows glowing, searchlight beam, drifting smoke. |
| s04 | A5 | Dark museum studio, polished dark round pedestal with thin gold rim under a top spotlight, an ornate wooden frame with a faded sepia archival photo of a 1980s military parade with tanks (no recognisable faces), dust in the beam. |
| s05 | A5 | Dark museum studio, two pedestals with gold rims, each holding an anonymous black silhouette bust of a bearded man in a turban, backlit by orange rim light, faces fully in shadow and unrecognisable. |
| s06 | A5 | Dark museum studio, a row of four small pedestals under narrow warm spotlights: a stack of old library books, a police peaked cap, a steel chain, a wooden judge gavel; reflective floor, haze. |
| s07 | A6 | Satellite relief map at night: Pakistan gold, China tinted dark red, a glowing red-orange dotted arc from Islamabad over the Himalaya to Beijing, city lights, thin clouds. |
| s08 | A1,A3 | The red-walled mosque at night during an armed clash: orange muzzle flashes and fire bursts along the compound walls, tracer streaks, thick smoke lit orange; no close-up people, no gore. |
| s09 | A3 | Night cordon of concrete barriers on an empty street, out-of-focus soldier silhouettes in the foreground, a lone figure fully covered in a dark-blue burqa walking toward the cordon in a hard white searchlight, fire glow behind; no faces. |
| s10 | A1,A3 | Commando silhouettes advancing in a line toward the red-walled mosque, a large explosion fireball and smoke from the compound lighting everything orange, debris and dust; no gore. |
| s11 | A7 | Empty madrasa classroom after the siege: smoke-stained plaster walls, deep red carpet, rows of small wooden Quran stands, abandoned sandals, dust in shafts of daylight from a side window; no people. |
| s12 | A5 | Dark museum studio, three pedestals with gold rims, the middle taller, each with a stack of blank case files bound with string under narrow warm spotlights; no readable text. |
| s13 | A8 | Low angle on a grand white marble supreme court building: wide steps, tall columns, triangular pediment, overcast late-afternoon light, a Pakistani flag, a few small distant figures; no readable text. |
| s14 | A1 | Dawn after the siege: the red-walled mosque with golden dome and two red minarets seen from an empty street, walls scarred with bullet marks and soot, pink-gold sunrise haze, birds over the dome, an abandoned sandal on the road. |

## Shot list (61 shots)

| Shot | Set | Camera move | duration (s) |
|---|---|---|---|
| L01_1 | s01 | descending drone move from high and far down to the subject | 8 |
| L02_1 | s01 | slow orbit to the left around the subject | 6 |
| L03_1 | s02 | slow dolly push-in | 7 |
| L04_1 | s01 | slow orbit to the right around the subject | 8 |
| L04_2 | s01 | slow lateral tracking move | 8 |
| L04_3 | s01 | slow dolly pull-back | 8 |
| L05_1 | s03 | descending drone move from high and far down to the subject | 8 |
| L05_2 | s03 | slow dolly push-in | 8 |
| L06_1 | s03 | slow orbit to the left around the subject | 8 |
| L06_2 | s03 | slow crane up while tilting down | 8 |
| L07_1 | s04 | slow orbit to the right around the subject | 7 |
| L07_2 | s04 | slow lateral tracking move | 7 |
| L07_3 | s04 | slow dolly pull-back | 7 |
| L08_1 | s05 | descending drone move from high and far down to the subject | 6 |
| L08_2 | s05 | slow dolly push-in | 6 |
| L09_1 | s06 | slow orbit to the left around the subject | 7 |
| L09_2 | s06 | slow crane up while tilting down | 7 |
| L09_3 | s06 | slow orbit to the right around the subject | 7 |
| L10_1 | s06 | slow lateral tracking move | 7 |
| L10_2 | s06 | slow dolly pull-back | 7 |
| L11_1 | s07 | descending drone move from high and far down to the subject | 8 |
| L11_2 | s07 | slow dolly push-in | 8 |
| L12_1 | s08 | slow dolly pull-back | 4 |
| L13_1 | s09 | slow crane up while tilting down | 7 |
| L13_2 | s09 | slow orbit to the right around the subject | 7 |
| L13_3 | s09 | slow lateral tracking move | 7 |
| L14_1 | s08 | slow dolly push-in | 4 |
| L15_1 | s10 | slow dolly push-in | 8 |
| L15_2 | s10 | slow dolly push-in | 8 |
| L15_3 | s10 | slow orbit to the left around the subject | 8 |
| L16_1 | s11 | slow crane up while tilting down | 8 |
| L16_2 | s11 | slow orbit to the right around the subject | 8 |
| L17_1 | s10 | slow lateral tracking move | 8 |
| L17_2 | s10 | slow dolly pull-back | 8 |
| L18_1 | s12 | descending drone move from high and far down to the subject | 8 |
| L18_2 | s12 | slow dolly push-in | 8 |
| L19_1 | s12 | slow orbit to the left around the subject | 8 |
| L19_2 | s12 | slow crane up while tilting down | 8 |
| L20_1 | s13 | slow orbit to the right around the subject | 7 |
| L20_2 | s13 | slow lateral tracking move | 7 |
| L20_3 | s13 | slow dolly pull-back | 7 |
| L21_1 | s14 | descending drone move from high and far down to the subject | 8 |
| L21_2 | s14 | slow dolly push-in | 8 |
| L22_1 | s06 | slow orbit to the left around the subject | 7 |
| L22_2 | s06 | slow crane up while tilting down | 7 |
| L22_3 | s06 | slow orbit to the right around the subject | 7 |
| L23_1 | s11 | slow lateral tracking move | 5 |
| L24_1 | s11 | slow dolly pull-back | 5 |
| L24_2 | s11 | descending drone move from high and far down to the subject | 5 |
| L25_1 | s13 | slow dolly push-in | 8 |
| L26_1 | s13 | slow orbit to the left around the subject | 7 |
| L26_2 | s13 | slow crane up while tilting down | 7 |
| L27_1 | s14 | slow orbit to the right around the subject | 6 |
| L27_2 | s14 | slow lateral tracking move | 6 |
| L27_3 | s14 | slow dolly pull-back | 6 |
| L28_1 | s13 | slow crane up while tilting down | 8 |
| L29_1 | s14 | slow dolly push-in | 8 |
| L29_2 | s14 | slow orbit to the left around the subject | 8 |
| L30_1 | s01 | slow dolly pull-back | 7 |
| L30_2 | s01 | slow orbit to the right around the subject | 7 |
| L30_3 | s01 | slow lateral tracking move | 7 |

## When finished

Give me `lalmasjid-clips.zip` (all `<shot>.mp4`) plus `A1…A8` and the start frames, and report any shot that failed.
