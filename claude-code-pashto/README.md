# Claude Code — Pashto release video (9:16)

A clean, minimal product-release explainer about Claude Code (کلاوډ کوډ). The style follows Google / Telegram feature intros: a white canvas, one idea per screen, large Pashto type, and a single coral accent.

- **Narration:** `assets/audio/voiceover.mp3`, the supplied Pashto voiceover, used as-is (no TTS). It is 76.03 s long; the last spoken word ends at ≈75.36 s.
- **Music:** the supplied `music-only.mp3`, mixed underneath as `assets/audio/music-ducked.m4a`. It ducks smoothly under speech (−4.5 dB in pauses, −11 dB under the voice, 0.25 s attack, 1.1 s release, with look-ahead).
- **Video:** 76.8 s at 1080×1920, 30 fps, H.264/AAC. The final lockup settles and fades to white after the last word.
- **Timing:** `timing/aligned.json` holds a start time for every transcript word. They come from the voice's own pauses (paragraph and comma breaks), with the words in between distributed by length. Every scene and key phrase is keyed to those times.

| Time (s)  | Scene                                                                  |
| --------- | ---------------------------------------------------------------------- |
| 0–11.3    | «مصنوعي ځيرکتيا»: chat bubbles → «د حقيقي پروګرامر په څير»          |
| 10.9–24.0 | Logo reveal «کلاوډ کوډ», then لوستل · پوهېدل · سمول · ليکل            |
| 23.5–42.7 | Terminal demo: project → request → read files → connections → fix     |
| 42.1–54.7 | GitHub · bug fixing · new features · analysis, then the summary grid  |
| 54.3–67.5 | More than showing code: «د پروګرامر ځيرک ملګری», shared tasks         |
| 67.0–76.8 | «ستاسو د کار طريقه», tangled → calm line, final lockup               |

Fonts (Vazirmatn, Inter, JetBrains Mono), GSAP and Octicons are vendored locally.

Re-render with `npx hyperframes render --quality high --output renders/claude-code-pashto.mp4`.
