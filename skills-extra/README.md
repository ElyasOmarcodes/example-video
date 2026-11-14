# Extra skills

| Skill | Source | Installed at |
|---|---|---|
| remotion-motion-graphics | https://github.com/haidrrrry/claude-remotion-skill | `~/.claude/skills/remotion-motion-graphics` |
| motion-design-howseen | https://github.com/howseen-ai/claude-motion-design (its skill is named `motion-design`; renamed here so it doesn't clash with claude-motion's `motion-design`) | `~/.claude/skills/motion-design-howseen` |

Reinstall after a fresh container:

```bash
mkdir -p ~/.claude/skills && cp -r skills-extra/remotion-motion-graphics skills-extra/motion-design-howseen ~/.claude/skills/
pip install "playwright==1.62.0" imageio-ffmpeg numpy pillow
```

Python Playwright is pinned to 1.62.0 because that version matches the pre-installed browser (`/opt/pw-browsers/chromium-1243`); do not run `playwright install`. Remotion projects use the Node packages already installed in `claude-motion/node_modules`.
