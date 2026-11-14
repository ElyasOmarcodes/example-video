"""Sound for the Hindukush logo intro. Times come from timeline.json (claude-motion sfx engine)."""
from sfx.synth import chime, envelope, impact, pad, pop, riser, whoosh

TIMELINE = "timeline.json"
OUT = "public/sfx.wav"
TARGET_LUFS = -14.0
BED = [130.81, 196.0, 261.63, 329.63, 392.0]   # C major add9


def score(mix, tl):
    dur, put = tl["duration"], mix.put
    vol = envelope([(0, 0), (0.6, 1), (tl["exit"], 1), (dur, 0)])
    mix.put_stereo(0, *pad(dur, [(0, BED)], volume=vol), gain=0.03)
    put(tl["rays"] - 0.55, riser(0.6, 300, 4200), 0.10)
    put(tl["rays"], whoosh(0.5, 300, 2600, peak=0.4), 0.16)
    put(tl["mark"] - 0.03, impact(1.2), 0.42)
    put(tl["mark"] + 0.02, pop(520, 160), 0.28)
    put(tl["word"], whoosh(0.7, 2200, 380, peak=0.5), 0.18, 0.3)
    put(tl["sweep"] + 0.1, chime([1046.5, 1568.0, 2093.0], dur=1.6, tau=0.55), 0.12)
    put(tl["bar"], whoosh(0.3, 900, 3200, peak=0.4), 0.08, -0.2)
    put(tl["handle"], pop(880, 440, dur=0.12), 0.16)
    put(tl["exit"], whoosh(0.5, 2600, 220, peak=0.5), 0.14)
