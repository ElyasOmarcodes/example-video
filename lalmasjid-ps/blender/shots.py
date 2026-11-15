"""Animated camera reference clips for every shot (motion guides for Seedance).
Builds each scene set from scenes.py, replaces the still camera with a keyframed move,
renders low-sample Cycles at 12 fps, 360x640, and writes shots.json.
Usage: python3 shots.py OUTDIR [shot_id ...]"""
import bpy, json, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = sys.argv[1]
ONLY = set(sys.argv[2:])
import scenes as S  # noqa: E402

CAP = {}
def cap_camera(loc, target, lens=35, dof=None):
    CAP.update(loc=Vector(loc), target=Vector(target), lens=lens)
S.camera = cap_camera
S.render = lambda name: None

FPS = 6
MOVES = ['push', 'orbitL', 'crane', 'orbitR', 'truck', 'pull', 'descend']
# per-line move overrides for story beats
BEAT = {'L01': 'descend', 'L03': 'push', 'L12': 'pull', 'L14': 'push', 'L15': 'push', 'L28': 'crane', 'L30': 'pull'}

def plan():
    tl = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
    shots, mi = [], 0
    lines = tl['lines']
    for i, l in enumerate(lines):
        end = lines[i + 1]['a'] if i + 1 < len(lines) else tl['total']
        d = end - l['a']
        k = max(1, math.ceil(d / 8))
        for j in range(k):
            mv = BEAT.get(l['id']) if j == 0 and l['id'] in BEAT else MOVES[mi % len(MOVES)]
            mi += 1
            sd = d / k
            shots.append({'id': f"{l['id']}_{j + 1}", 'line': l['id'], 'scene': l['scene'], 'move': mv,
                          't0': round(l['a'] + j * sd, 3), 'dur': round(sd, 3), 'gen_dur': max(4, min(15, math.ceil(sd)))})
    return shots

def animate(move, nfr):
    L, T, lens = CAP['loc'], CAP['target'], CAP['lens']
    d = L - T
    def rot(v, a):
        c, s = math.cos(a), math.sin(a)
        return Vector((v.x * c - v.y * s, v.x * s + v.y * c, v.z))
    side = Vector((-d.y, d.x, 0)).normalized() * d.length * 0.18
    if move == 'push':    a, b = (T + d * 1.15, T), (T + d * 0.72, T)
    elif move == 'pull':  a, b = (T + d * 0.75, T), (T + d * 1.15, T)
    elif move == 'orbitL': a, b = (T + rot(d, -0.22), T), (T + rot(d, 0.18), T)
    elif move == 'orbitR': a, b = (T + rot(d, 0.22), T), (T + rot(d, -0.18), T)
    elif move == 'crane': a, b = (L + Vector((0, 0, -d.length * 0.12)), T), (L + Vector((0, 0, d.length * 0.18)), T + Vector((0, 0, -d.length * 0.03)))
    elif move == 'truck': a, b = (L - side, T - side * 0.6), (L + side, T + side * 0.6)
    elif move == 'descend': a, b = (T + d * 1.6 + Vector((0, 0, d.length * 0.6)), T), (L, T)
    cd = bpy.data.cameras.new('Cam'); cd.lens = lens
    cam = bpy.data.objects.new('Cam', cd); bpy.context.collection.objects.link(cam)
    tgt = bpy.data.objects.new('Tgt', None); bpy.context.collection.objects.link(tgt)
    con = cam.constraints.new('TRACK_TO'); con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    for f, (p, q) in ((1, a), (nfr, b)):
        cam.location = p; cam.keyframe_insert('location', frame=f)
        tgt.location = q; tgt.keyframe_insert('location', frame=f)
    for ob in (cam, tgt):
        for fc in ob.animation_data.action.fcurves if hasattr(ob.animation_data.action, 'fcurves') else []:
            for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
    bpy.context.scene.camera = cam

def main():
    shots = plan()
    os.makedirs(OUT, exist_ok=True)
    json.dump(shots, open(os.path.join(OUT, 'shots.json'), 'w'), indent=1)
    builders = {f's{n:02d}': getattr(S, name) for n, name in enumerate(
        ['s01_siege', 's02_map', 's03_standoff', 's04_zia', 's05_brothers', 's06_escalation', 's07_china', 's08_clashes',
         's09_escape', 's10_operation', 's11_hall', 's12_numbers', 's13_court', 's14_dawn'], 1)}
    for sh in shots:
        if ONLY and sh['id'] not in ONLY: continue
        dst = os.path.join(OUT, sh['id'])
        if os.path.exists(dst + '.done'): continue
        builders[sh['scene']]()
        sc = bpy.context.scene
        nfr = sh['gen_dur'] * FPS
        sc.frame_start, sc.frame_end = 1, nfr
        sc.render.fps = FPS
        sc.render.resolution_x, sc.render.resolution_y = 288, 512
        sc.render.use_persistent_data = True
        sc.cycles.samples = 3
        sc.cycles.use_denoising = True
        sc.cycles.max_bounces = 2
        animate(sh['move'], nfr)
        sc.render.image_settings.file_format = 'JPEG'
        sc.render.filepath = os.path.join(dst, 'f_')
        bpy.ops.render.render(animation=True)
        open(dst + '.done', 'w').write('1')
        print('SHOT', sh['id'], sh['move'], flush=True)

main()
