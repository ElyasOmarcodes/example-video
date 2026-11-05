# Writes premiere/Ikhtilaf_Pashto_Premiere.xml (Final Cut Pro 7 XML, imports into Adobe Premiere Pro).
# V1 = rendered video (picture only); A1 voiceover, A2 music bed, A3 sound effects; one marker per scene.
import json, re, os, subprocess
from xml.sax.saxutils import escape
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, ".."))
FPS = 30
html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
SC = json.loads(re.search(r"const D = (\[.*?\]);\n", html, re.S).group(1))
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
F = lambda s: int(round(s * FPS))
END = F(SC[-1]["t1"])
RATE = f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"
media = {"video": "renders/ikhtilaf-pashto.mp4", "vo": "assets/audio/voiceover.mp3", "music": "assets/audio/music.m4a", "sfx": "assets/audio/sfx.m4a"}
def fileel(fid, rel, kind):
    p = os.path.join(ROOT, rel); n = F(dur(p))
    v = f"<video><samplecharacteristics>{RATE}<width>1080</width><height>1920</height></samplecharacteristics></video>" if kind == "video" else ""
    return f'<file id="{fid}"><name>{os.path.basename(rel)}</name><pathurl>file://localhost/{escape(p)}</pathurl>{RATE}<duration>{n}</duration><media>{v}<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio></media></file>', n
def clip(cid, fid, rel, kind, name, track_kind):
    fx, n = fileel(fid, rel, kind)
    end = min(n, END)
    return f'<clipitem id="{cid}"><name>{escape(name)}</name><duration>{n}</duration>{RATE}<start>0</start><end>{end}</end><in>0</in><out>{end}</out>{fx}' + (f"<sourcetrack><mediatype>{track_kind}</mediatype><trackindex>1</trackindex></sourcetrack>") + "</clipitem>"
markers = ""
for sc in SC:
    name = sc.get("head") or ("سرلیک" if sc["kind"] == "intro" else "اوټرو")
    if sc["kind"] == "item": name = f'{sc["n"]}. {name}'
    markers += f'<marker><name>{escape(name)}</name><comment>{escape(sc.get("text", "") or "")}</comment><in>{F(sc["t0"])}</in><out>-1</out></marker>'
v1 = clip("v1", "f-video", media["video"], "video", "Ikhtilaf Pashto (rendered)", "video")
a = [clip("a1", "f-vo", media["vo"], "audio", "Voiceover", "audio"), clip("a2", "f-music", media["music"], "audio", "Music (very low)", "audio"), clip("a3", "f-sfx", media["sfx"], "audio", "Sound effects", "audio")]
xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4"><project><name>Ikhtilaf_Pashto — Hindukush</name><children>
<sequence id="seq"><name>Ikhtilaf Pashto 1080x1920</name><duration>{END}</duration>{RATE}
<timecode>{RATE}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>{markers}
<media><video><format><samplecharacteristics>{RATE}<width>1080</width><height>1920</height><pixelaspectratio>square</pixelaspectratio></samplecharacteristics></format><track>{v1}</track></video>
<audio><format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>{"".join(f"<track>{x}</track>" for x in a)}</audio></media>
</sequence></children></project></xmeml>'''
open(os.path.join(ROOT, "premiere", "Ikhtilaf_Pashto_Premiere.xml"), "w", encoding="utf-8").write(xml)
print("ok", END, "frames")
