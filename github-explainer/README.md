# GitHub explainer (Arabic, 9:16)

Premium 2.5D motion-graphics explainer about GitHub, built with HyperFrames.

- **Narration:** `assets/audio/voiceover.mp3`, the supplied Arabic voiceover, used verbatim (no TTS). It is the master timeline.
- **Length:** 162.9 s. That is the full 162.05 s voiceover, plus ~1.5 s of visual settle and fade after the last spoken word (~161.4 s).
- **Format:** 1080×1920, 30 fps, full-bleed.
- **Output:** `renders/github-explainer.mp4`

## How the timing was built

`timing/aligned.json` holds word-level timestamps for every word in `timing/transcript.txt`, aligned against the audio. The aligner ran Whisper-base (ONNX) locally, then matched the result to the provided transcript and cross-checked it against detected pauses. Each scene and each on-screen keyword in `index.html` is keyed to those times. For example, "GitHub" is revealed at 14.3 s, "Pull Request" at 97.6 s, and "GitHub Actions" at 109.7 s.

## Chapters

| Time (s)    | Chapter                                                    |
| ----------- | ---------------------------------------------------------- |
| 0.0–15.6    | The question: scattered files and developers → GitHub reveal |
| 15.6–25.7   | The GitHub repository environment (save / manage / share)  |
| 25.0–35.0   | Git: tracking changes, Commit 01 → 04                      |
| 34.4–60.5   | App versions V1–V4, a regression, rolling back to V2       |
| 59.7–73.7   | Repository: the 3D file tree and commit history            |
| 73.0–91.5   | Teamwork, then independent branches off `main`             |
| 90.8–99.6   | Pull Request: review, approve, merge                       |
| 98.9–108.7  | Issues: Open → Assigned → In Progress → Closed             |
| 108.0–121.0 | GitHub Actions: CODE → COMMIT → BUILD → TEST → DEPLOY      |
| 120.2–137.1 | Open Source: the global developer network                  |
| 136.4–149.7 | "Not just a code host": an integrated environment          |
| 149.0–162.9 | Git + GitHub: a core skill, then settle and fade           |

## Audio

- `voiceover.mp3`: narration at its original level (−15.5 LUFS).
- `music.m4a`: an original ambient bed. It is synthesised, ducked under the voice, and played at `data-volume=0.7`.
- `sfx.m4a`: soft UI sound effects, placed on the same cue times as the visuals.

## Commands

```bash
npx hyperframes check                     # lint + runtime + layout + contrast
npx hyperframes preview                   # Studio preview
npx hyperframes render --quality high --output renders/github-explainer.mp4
```

Fonts (IBM Plex Sans Arabic, Inter, JetBrains Mono), GSAP and the GitHub Octicons are vendored locally under `assets/fonts` and `lib/`, so renders never touch the network.
