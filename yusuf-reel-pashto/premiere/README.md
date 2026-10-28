# د پریمیر پروژه — Premiere Pro import

**Files (keep all three in the same folder)**
- `Yusuf_Reel_Premiere.xml`: the project (an editable sequence, 1080×1920, 30 fps)
- `yusuf-reel-pashto.mp4`: the finished motion graphic (H.264)
- `nasheed-trimmed.wav`: the sound effect with the intro removed

**How to open it in Premiere Pro**
1. Open Premiere Pro. Choose **File → Import…** and select `Yusuf_Reel_Premiere.xml`.
2. Premiere builds a bin containing the sequence **"Yusuf Reel (Pashto) 1080x1920"**.
3. If Premiere asks to *Link Media*, click **Locate** and pick this same folder. Both files then relink automatically.
4. Save as a normal Premiere project (**File → Save As → .prproj**).

**What's inside the sequence**
- **V1**: the video, cut into 16 clips, one per sentence or text beat. You can trim, move or replace each one separately.
- **A1/A2**: the nasheed. The first 8.25 s (the intro) is already removed, with a soft fade-in at the start and a fade-out at the end.
- **Markers**: each sentence's Pashto text sits at its exact time on the timeline.

The text and graphics are baked into the video. To change wording, colours or motion, edit `../index.html` (the HyperFrames source) and re-render.
