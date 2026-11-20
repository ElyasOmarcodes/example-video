# نہضت — پاکستان: خود مختار ملک یا فوجی چھاؤنی؟ (اردو)

- ویډیو: `renders/nahzat-ur.mp4` — 1080×1920، 30 fps، ۴:۱۴، −14 LUFS
- غږ: Marcus (روایت)، Sterling (د امریکايي ولسمشر غوښتنه)، Arthur (د طالبانو ځواب) — Higgsfield، ElevenLabs انجن
- هیګزفیلډ ویډیو: سرلیک، نیویارک، اوټرو — هر یو د بلنډر ۵ ثانیه‌يي صحنې (`blender/animatics.py`) پر بنسټ، Kling 4.0 Flash video-edit، یو ځل
- موسیقي: ElevenLabs Music v2.5 (`audio/score.mp3`)؛ صوتي اغېزې: Mixkit (وړیا جواز) + درې Mirelo
- نقشه: ریښتینی لوړوالی (AWS terrain tiles)، NASA Blue Marble رنګ، Natural Earth پولې

بیا جوړول:
```
python3 tools/plan.py                 # timeline from the narration
python3 tools/geo_prep.py             # map data (once)
python3 tools/sound.py                # audio/mix.wav
node tools/build.mjs                  # web/bundle.js
python3 -m http.server 8770 --bind 127.0.0.1 --directory web &
node tools/capture.mjs --from 0 --to 7 --out renders/parts/A.mp4      # + B, C, D
bash tools/assemble.sh
```
