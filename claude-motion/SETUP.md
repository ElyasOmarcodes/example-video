# Setup in this workspace

- Installed from https://github.com/whaleyxbt/claude-motion (MIT); `media/` and `.git` were left out.
- `npm install` is done. `npm run build` was verified and produces `out/effort.mp4`. `npm run sims` and `npm run capture -- engine --still 5` were also verified.
- Skills: the project-level copies are in `.claude/skills/`. User-level copies are in `~/.claude/skills/` (motion-design, sound-design, review-loop, web-sims).
- Headless Chromium: `export CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` before `npm run capture`.
- After a fresh container: run `npm install` again here (node_modules is not committed).
