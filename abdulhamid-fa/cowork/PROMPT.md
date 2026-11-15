You are the director, cinematographer and editor of a short historical film. Use the connected **Higgsfield** tools to make every image, video clip and voice line, then cut everything together into ONE finished vertical MP4 that I can download. Work through the whole pipeline yourself without stopping to ask me, except where this brief says to ask.

## 0. Rules for this job

- **Pay with my free-trial unlimited generations.** Set `use_unlim: true` on EVERY Higgsfield generation call (images, videos, audio). Never spend credits. If a call is rejected for unlim, stop and tell me; do not retry on credits.
- **Format:** vertical 9:16 for everything. Video at 1080p if unlim allows it, otherwise 720p.
- **Look:** photoreal, Bollywood/Netflix period-epic production value. Real actors, real sets, real light. No cartoon, no illustration, no 3D-render look, no text or letters inside any image or video.
- **Era accuracy:** Ottoman Empire, 1896-1909. Men wear the fez (red felt, black tassel) and dark frock coats (stambouline); soldiers wear 1908 Ottoman khaki/blue-grey uniforms with kalpak or fez; no modern objects.
- **Consistency:** the Sultan must look like the SAME man in every shot. Always pass the Sultan key image (step 2) as a reference when he appears.
- Keep a running log of every job id and output URL in a file `log.md` so nothing is lost.

## 1. Reference photos I attached

1. `01_sultan_abdulhamid.jpg` — Sultan Abdulhamid II (the real person; match his face).
2. `02_herzl.jpg` — Theodor Herzl.
3. `03_karasu.jpg` — Emmanuel Karasu (one of the four deputies).
4. `04_mahmud_shevket.jpg` — Mahmud Shevket Pasha (commander of the Action Army).

Upload them with `media_upload` → PUT → `media_confirm`, and note their media ids.

## 2. Character key images (make these first)

Model: `gpt_image_2_6`, quality `high`, resolution `2k`, aspect `9:16`, `use_unlim: true`.

**K1 — Sultan Abdulhamid II, age 66.** Reference: `01_sultan_abdulhamid.jpg`.
> Photoreal cinematic portrait of Sultan Abdulhamid II, Ottoman Sultan, age 66, matching the reference photo's face exactly: long narrow face, large prominent hooked nose, deep-set heavy-lidded dark eyes, full dark beard trimmed short and greying at the edges, thin moustache. Wearing a dark navy wool stambouline frock coat buttoned to the neck, a single star decoration, a tall red felt fez. Neutral grey studio backdrop, soft key light from the left, 85mm lens, sharp focus on the eyes, natural skin texture, film grain. No text.

**K2 — Theodor Herzl, age 36.** Reference: `02_herzl.jpg`.
> Photoreal portrait of Theodor Herzl in 1896, age 36, matching the reference face: long full black beard, high forehead, dark intense eyes. Black European frock coat, white wing collar. Grey studio backdrop, soft light, 85mm, film grain. No text.

**K3 — Esad Pasha Toptani** (no photo; invent consistently).
> Photoreal portrait of an Albanian Ottoman general, age 45, broad face, thick dark moustache, no beard, stern eyes, Ottoman general's dark uniform with gold collar embroidery, red fez. Grey backdrop, soft light, 85mm, film grain. No text.

**K4 — Mahmud Shevket Pasha.** Reference: `04_mahmud_shevket.jpg`.
> Photoreal portrait matching the reference: Ottoman general, age 52, grey moustache, field uniform with kalpak. Grey backdrop, 85mm, film grain. No text.

Show me K1 only, then continue without waiting (I can interrupt).

## 3. The 14 shots — start frames

For each shot below make the **start frame** with `gpt_image_2_6` (quality `high`, `2k`, `9:16`, `use_unlim: true`). Pass the listed character key images as `image_references`. Use the shot's IMAGE PROMPT. Add this suffix to every image prompt:

> "Photoreal 35mm anamorphic film still from a big-budget historical epic, practical sets, natural skin texture, volumetric light, rich but natural colour grade, subtle film grain, shallow depth of field. No text, no letters, no watermark."

Then make the **video clip** with `seedance_2_5`, `mode: "omni_reference"`, the start frame as `start_image`, the same character keys as `image_references`, `aspect_ratio: "9:16"`, `generate_audio: false` (I add the voice and sound myself), the shot's DURATION, and the shot's MOTION PROMPT. Add this suffix to every motion prompt:

> "Realistic human motion and physics, cinematic camera, no cuts, no text, no morphing faces, keep the faces identical to the references."

Run the clips in batches (`generate_video_batch`, up to 12 at a time), then `jobs_wait`.

| # | Duration | Characters |
|---|---|---|
| C01 | 7 s | K1 |
| C02 | 5 s | K1 |
| C03 | 12 s | — |
| C04 | 7 s | — |
| C05 | 7 s | K1, K2 |
| C06 | 5 s | K1 |
| C07 | 8 s | — |
| C08 | 5 s | — |
| C09 | 5 s | K4 |
| C10 | 6 s | K4 |
| C11 | 7 s | — |
| C12 | 6 s | K1, K3, Karasu photo |
| C13 | 6 s | K1 |
| C14 | 9 s | K1 |

**C01 — Yildiz Palace study, dawn, 27 April 1909.**
IMAGE: Sultan Abdulhamid II sits alone at a carved walnut writing desk in his private study at Yildiz Palace, Istanbul, at dawn. Golden sunrise light streams through tall arched windows with lace curtains; dust floats in the beams. Ottoman carpets, a brass oil lamp still burning, stacks of telegrams, a fountain pen in his hand. He looks up, worried, toward the door. Medium-wide shot from the doorway, camera at chest height.
MOTION: Slow push-in from the doorway toward the Sultan (dolly forward ~1.5 m), he slowly lowers the pen and looks toward camera-left, dust drifting in the light beams, curtain moving slightly in the breeze.

**C02 — Night, the guarded departure.**
IMAGE: Night at Sirkeci railway station, Istanbul, 1909. Sultan Abdulhamid II in a dark overcoat and fez walks along the platform between two lines of Ottoman soldiers with rifles and bayonets. A black steam locomotive breathes steam under gas lamps. Low angle from behind the soldiers.
MOTION: Slow tracking shot moving sideways alongside the Sultan as he walks, steam rolling across the platform, gas lamps flickering, soldiers standing rigid.

**C03 — The empire he inherited, and what was lost.**
IMAGE: Top-down view of a huge antique hand-drawn map of the Ottoman Empire in 1876 spread on a war-room table, from the Balkans to Yemen, lit by candles. Brass inkwell, compass, red wax seals. An old man's hand in a dark sleeve rests on the map.
MOTION: Very slow overhead crane drift across the map from the Balkans to Arabia; the hand slowly removes three small brass markers from Cyprus, Egypt and the Balkans; candle flames flicker; one candle goes out at the end.

**C04 — Censorship and spies.**
IMAGE: A long dim palace corridor at Yildiz, night. Men in dark coats and fezzes whisper at half-open doors; one hands over a folded paper; a clerk at a desk stamps documents under a green-shaded lamp. Deep perspective, pools of lamplight.
MOTION: Slow steady dolly down the corridor; figures glance at the camera and turn away; the clerk stamps a document; a door closes softly.

**C05 — Herzl's offer, June 1896.**
IMAGE: An ornate Ottoman reception hall in Istanbul. Theodor Herzl (K2), in a black frock coat, stands holding a leather folder of papers, speaking respectfully toward Sultan Abdulhamid II (K1) who sits in a gilded armchair, listening with a cold expression. Court officials in fezzes stand at the edges. Afternoon light through high windows.
MOTION: Slow arc around Herzl toward the Sultan; Herzl gestures with the folder; the Sultan does not move, only his eyes narrow.

**C06 — "Not one span of this land."**
IMAGE: Close-up of Sultan Abdulhamid II (K1) standing at a tall palace window at dusk, looking out over the Bosphorus and the domes and minarets of Istanbul, his face half in warm light and half in shadow, jaw set.
MOTION: Very slow push-in to an extreme close-up of his eyes; he turns his head slightly toward camera; the city lights flicker on behind him.

**C07 — Salonica, July 1908: the young officers.**
IMAGE: A sunlit square in Salonica, 1908. Young Ottoman officers in uniform stand on steps holding a red flag with a white crescent and star, addressing a cheering crowd of men in fezzes and straw hats; banners, horse carts, Ottoman-era buildings.
MOTION: Slow crane up from the cheering crowd to the officers on the steps; flags waving; hats thrown in the air.

**C08 — The mutiny, April 1909.**
IMAGE: Istanbul street at dawn, April 1909. Ottoman soldiers and religious students in turbans march angrily, rifles raised, in front of a mosque; smoke, scattered papers on wet cobblestones.
MOTION: Handheld camera walking backward in front of the marching crowd; soldiers shouting; smoke drifting.

**C09 — The Action Army sets out.**
IMAGE: Salonica railway station, 1909. Mahmud Shevket Pasha (K4) stands on the platform as soldiers in field uniforms board a long steam troop train; steam, rifles, crates.
MOTION: Wide slow pan following the train as it starts moving; steam bursts from the locomotive; Shevket Pasha salutes.

**C10 — Into Istanbul, 24 April.**
IMAGE: Ottoman soldiers of the Action Army advance through a narrow Istanbul street toward a stone barracks at dawn, rifles ready; Mahmud Shevket Pasha (K4) on horseback behind them; smoke over the rooftops.
MOTION: Low tracking shot moving forward with the soldiers; the barracks gate opens; a white flag appears in a window.

**C11 — The assembly votes.**
IMAGE: The Ottoman National Assembly in session behind closed doors, 27 April 1909. Rows of deputies in fezzes and frock coats; a white-turbaned Sheikh al-Islam official reads a fatwa from a document at the rostrum; tense faces; tall windows with curtains drawn.
MOTION: Slow dolly along the rows of deputies; one by one they raise their hands to vote; the official lowers the paper.

**C12 — The delegation at Yildiz.**
IMAGE: Evening in a dark palace office at Yildiz. Four deputies stand in a line before Sultan Abdulhamid II (K1), who stands behind his desk. In front, Esad Pasha Toptani (K3) in general's uniform speaks; Emmanuel Karasu (photo 03) stands beside him. A single oil lamp lights the faces.
MOTION: Slow push-in over Esad Pasha's shoulder onto the Sultan's face as the words land; the Sultan's hand grips the edge of the desk.

**C13 — The Sultan boards the train.**
IMAGE: Night. Sultan Abdulhamid II (K1), older and tired, in a long dark overcoat, steps up into a dark green railway carriage, helped by a servant; guards with lanterns; steam and rain.
MOTION: Camera inside the carriage looking out through the door as he climbs in; he pauses on the step and looks back at the station; rain falling in lantern light.

**C14 — Towards Salonica.**
IMAGE: A black steam train crossing a dark countryside at night, lit windows glowing, smoke trailing under a moonlit sky; inside one window the silhouette of Sultan Abdulhamid II (K1) sitting still.
MOTION: Wide shot slowly pushing in toward the lit window as the train passes; then the train recedes into the dark; final frame is nearly black with the red tail lamp.

After all clips are done, look at each one. If a clip has warped faces, extra limbs or wrong-era objects, regenerate it ONCE with a corrected prompt.

## 4. Narration (Persian / Farsi)

Make the voice with `seed_audio` (`use_unlim: true`), a deep, calm, mature male Persian documentary narrator. First call `list_voices` and pick the most fitting deep male voice; make one test line (L01) and show it to me. Use `speech_rate: -8`. If `seed_audio` cannot pronounce Persian well, use `text2speech_v2` with `variant: "elevenlabs"` and a deep male voice instead. One generation per line (use `generate_audio_batch`):

- L01: صبحِ بیست‌وهفتم آوریلِ ۱۹۰۹، سلطان عبدالحمید دوم، هنوز در کاخ یلدز بود.
- L02: شب، او زیر نگهبانی سربازان، با قطاری از استانبول بیرون برده می‌شد.
- L03: سی‌وسه سال پیش، امپراتوری‌ای را تحویل گرفته بود که از بالکان تا یمن کشیده شده بود.
- L04: اما در دوران او، قبرس، مصر و بخش بزرگی از بالکان از دست رفت.
- L05: او با سانسور و هزاران جاسوس حکومت می‌کرد، و مجلس را سی سال بسته نگه داشت.
- L06: وقتی تئودور هرتزل در برابر فلسطین، پرداخت بدهی‌های عثمانی را پیشنهاد داد، سلطان گفت:
- L07: حتی یک وجب از این خاک را نمی‌فروشم.
- L08: اما در تابستان ۱۹۰۸، افسران جوان در سالونیک شوریدند، و او مجبور شد قانون اساسی را برگرداند.
- L09: نُه ماه بعد، سربازانِ استانبول علیه همین افسران شورش کردند.
- L10: از سالونیک، «ارتش حرکت» با قطار به سوی پایتخت راه افتاد.
- L11: بیست‌وچهارم آوریل، سربازانش وارد استانبول شدند، و پادگان‌ها را یکی‌یکی گرفتند.
- L12: سه روز بعد، مجلس پشت درهای بسته فتوایی را خواند، و به برکناری سلطان رأی داد.
- L13: چهار نماینده به یلدز رفتند. اسعد پاشا به او گفت:
- L14: ملت، شما را خلع کرده است.
- L15: همان شب، سلطانی که سال‌ها به‌ندرت از کاخش بیرون آمده بود، سوار قطار شد.
- L16: و مقصدش، همان شهری بود که شورش علیه او از آنجا آغاز شده بود.
- L17: سالونیک. قسمت دوم را از دست ندهید.

L07 is the Sultan's own words: make it slower and more solemn. L14 is Esad Pasha: if possible use a second, harsher male voice.

## 5. Music and sound

- Music: `suno_music` (`use_unlim: true`), instrumental, 100 seconds: "Dark orchestral historical drama score, low strings, ney flute and oud, slow tension, Ottoman colour, cinematic, no vocals, builds to a sombre climax and fades at the end."
- Sound effects with `mirelo_text_to_audio` (`use_unlim: true`), 5–8 s each: (a) steam locomotive hiss and departure at night, (b) crowd of soldiers shouting in a street, (c) quiet palace room ambience with clock ticking, (d) rain on a railway platform with distant steam.

## 6. Edit and deliver

Download every clip, voice line and sound to your sandbox and edit with ffmpeg (or Python + moviepy):

1. Clip order C01 → C14. Narration lines map to clips: C01=L01, C02=L02, C03=L03+L04, C04=L05, C05=L06, C06=L07, C07=L08, C08=L09, C09=L10, C10=L11, C11=L12, C12=L13+L14, C13=L15, C14=L16+L17.
2. Each line starts 0.3 s after its clip starts. If the narration for a clip is longer than the clip, slow the clip slightly (`setpts`) or hold its last frame; if shorter, trim the clip to narration + 0.8 s (never under 3 s).
3. Transitions: 0.4 s cross-dissolve between clips; a dip to black before C02 and before C13; fade in from black at the start and fade to black at the end.
4. Colour: apply one consistent warm filmic grade to every clip (`eq=contrast=1.05:saturation=0.92`, a slight warm curve) so the shots match.
5. Mix: narration at full level (loudnorm to −16 LUFS), music ducked to about −22 dB under the voice and up to −14 dB in pauses and at the end, sound effects at −20 dB on the right clips (steam on C02/C09/C13/C14, crowd on C07/C08, palace ambience on C01/C04/C12, rain on C13). Final master −14 LUFS, true peak ≤ −1.5 dBTP.
6. Burn in small, clean Persian subtitles at the bottom (white text, soft dark shadow, font Vazirmatn or Noto Naskh Arabic, max two lines) with the narration text.
7. End card for the last 3 seconds: black, white text "قسمت ۲ — سالونیک".
8. Export H.264 1080×1920, 30 fps, AAC 192 kbps, `+faststart`. File name `abdulhamid-ep1-cinematic.mp4`.

Give me the final MP4 as a downloadable file, plus a zip of all raw clips, the voice lines and `log.md`.
