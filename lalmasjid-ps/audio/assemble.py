"""Joins every shot into public/bg.mp4 (1080x1920, 30 fps) on the narration timeline.
Uses public/clips/<shot>.mp4 (Higgsfield result) when present, else the Blender motion clip."""
import json, os, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
shots = json.load(open(os.path.join(R, 'renders/shots/shots.json')))
tl = json.load(open(os.path.join(R, 'timeline.json')))
tmp = os.path.join(R, 'out/bgparts'); os.makedirs(tmp, exist_ok=True)
parts, real = [], 0
first = shots[0]['t0']
for i, s in enumerate(shots):
    dur = (shots[i + 1]['t0'] if i + 1 < len(shots) else tl['total']) - s['t0']
    if i == 0: dur += first  # cover the lead-in
    clip = os.path.join(R, 'public/clips', s['id'] + '.mp4')
    if os.path.exists(clip): real += 1
    else: clip = os.path.join(R, 'cowork/pack/motion', s['id'] + '.mp4')
    out = os.path.join(tmp, f'{i:03d}.mp4')
    # slow the source if it is shorter than the slot so it never freezes
    src_d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', clip], capture_output=True, text=True).stdout)
    speed = min(1.0, src_d / dur)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', clip, '-t', f'{dur:.3f}', '-an',
                    '-vf', f'setpts=PTS/{speed:.4f},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', out], check=True)
    parts.append(out)
lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(R, 'public/bg.mp4')], check=True)
print(f'bg.mp4: {len(parts)} shots, {real} Higgsfield clips, {len(parts) - real} Blender placeholders')
