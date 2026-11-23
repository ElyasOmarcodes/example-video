# نہضت — پاکستان: خود مختار ملک یا فوجی چھاؤنی؟ (اردو)

- ویډیو: `renders/nahzat-ur.mp4` — 1080×1920، 30 fps، ۴:۰۸، −14 LUFS، په یوه پرله‌پسې رینډر کې (یو براوزر، یو انکوډر، هېڅ ټوټه نه)
- غږ: د کارن خپل روایت (`voice/user/narration.mp3`)؛ دوه نقل‌قولونه د پخوانیو غږونو سره بدل شوي — Sterling (د امریکايي ولسمشر غوښتنه، L06)، Marcus (د طالبانو ځواب، L08). پرې کول یوازې په چوپتیا یا ~۳۵ dB ټیټو ځایونو کې (`tools/voice_user.py`)
- فونټ: Al-Quds ته دوه‌چشمي «ھ» (U+06BE) ورزیات شوی — څلور شکلونه د همدې فونټ له «هـ» او کشیدې (`tools/font_dochashmi.py`)
- هیګزفیلډ ویډیو: سرلیک، نیویارک، اوټرو — هر یو د بلنډر ۵ ثانیه‌يي صحنې (`blender/animatics.py`) پر بنسټ، Kling 4.0 Flash video-edit، یو ځل
- موسیقي: ElevenLabs Music v2.5 (`audio/score.mp3`)؛ صوتي اغېزې: Mixkit (وړیا جواز) + درې Mirelo
- نقشه: ریښتینی لوړوالی (AWS terrain tiles)، NASA Blue Marble رنګ، Natural Earth پولې

بیا جوړول:
```
python3 tools/transcribe_user.py      # whisper word stamps of the user's narration
python3 tools/align_user.py           # script lines/words → narration time
python3 tools/voice_user.py           # quote splices + data/timeline.json + data/voice_plan.json
python3 tools/geo_prep.py             # map data (once)
python3 tools/sound.py                # audio/mix.wav
node tools/build.mjs                  # web/bundle.js
python3 -m http.server 8770 --bind 127.0.0.1 --directory web &
node tools/capture.mjs --from 0 --to 248.49 --out renders/film.mp4   # one pass, every frame in order
# then mux audio/mix.wav (video copied), tools/handbrake.sh for the small H.265 copy — see .github/workflows/nahzat-render.yml
```
