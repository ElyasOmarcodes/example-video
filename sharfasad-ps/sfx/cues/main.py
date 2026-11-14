"""Sound design for the sharfasad dossier explainer. All times come from timeline.json.

    PYTHONPATH=../claude-motion python3 -m sfx sfx/cues/main.py

This renders the SFX + bed only; scripts/mixdown.sh lays it under the voice-over.
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, scratch, whoosh

TIMELINE = "timeline.json"
OUT = "public/sfx.wav"
TARGET_LUFS = -14.0

# D minor investigative bed; lifts to Bb/F for the ending, darkens for the question.
DM = [146.83, 220.0, 293.66, 349.23]
BB = [116.54, 174.61, 233.08, 293.66]
GM = [98.0, 146.83, 196.0, 233.08]
F = [174.61, 261.63, 349.23, 440.0]


def stamp(mix, t, gain=1.0, pan=0.0):
    mix.put(t, impact(0.5), 0.22 * gain, pan)
    mix.put(t, click(900, dur=0.06), 0.30 * gain, pan)
    mix.put(t + 0.01, pop(260, 90, dur=0.12), 0.25 * gain, pan)


def card_in(mix, t, pan=0.0):
    mix.put(t, whoosh(0.45, 2400, 500, peak=0.5), 0.12, pan)
    mix.put(t + 0.38, click(1400, dur=0.04), 0.12, pan)


def score(mix, tl):
    put = mix.put
    dur = tl["duration"]
    secs, Q, E, O = tl["sections"], tl["q"], tl["end"], tl["outro"]

    # bed: very quiet, under the whole voice-over
    chords = [(0, DM)]
    for i, s in enumerate(secs):
        chords.append((s["t0"], [DM, GM, BB, GM, DM][i]))
    chords += [(Q["t0"], GM), (E["t0"], BB), (E["t0"] + 5, F), (O["t0"], DM)]
    vol = envelope([(0, 0), (1.0, 1), (Q["t0"] - 0.2, 1), (Q["t0"] + 0.4, 1.3), (E["t1"], 1.3), (dur - 1.5, 1), (dur, 0)])
    mix.put_stereo(0, *pad(dur, chords, volume=vol), gain=0.03)

    # title
    put(0.0, impact(1.6), 0.25)
    stamp(mix, 0.05, 0.9, -0.3)
    put(0.3, scratch(1.4), 0.05)
    for i in range(4):
        put(2.6 + i * 0.25, scratch(0.45), 0.08, -0.2 + i * 0.12)
    stamp(mix, 4.3, 1.0, 0.35)
    put(tl["title"]["t1"] - 0.45, whoosh(0.45, 600, 3200, peak=0.4), 0.14)

    for si, s in enumerate(secs):
        # hero: number pops in, heading reveals, then docks
        put(s["t0"] - 0.3, riser(0.35, 400, 3000), 0.08)
        put(s["t0"] + 0.05, impact(1.0), 0.2)
        put(s["t0"] + 0.08, pop(700, 260), 0.3)
        put(s["t0"] + 0.1, blip(293.66 * (1.5 if si % 2 else 1), dur=0.6, tau=0.2), 0.08)
        put(s["hb"] + 0.12, whoosh(0.5, 3000, 700, peak=0.45), 0.13)
        put(s["hb"] + 0.42, click(2200), 0.14, 0.3)
        bs = s["bullets"]
        for bi, b in enumerate(bs):
            enter = max(b["a"] - 0.45, s["hb"] + 0.4)
            if si != 1 or bi == 0:
                card_in(mix, enter, -0.25 + 0.2 * bi)
            nxt = bs[bi + 1]["a"] - 0.45 if bi + 1 < len(bs) else s["t1"] - 0.4
            if si != 1 or bi == len(bs) - 1:
                put(nxt, whoosh(0.42, 700, 2600, peak=0.4), 0.09, -0.5)
            a, d = b["a"], b["b"] - b["a"]
            key = (s["n"], bi)
            # illustration-specific events
            if key == (1, 0):
                for ft in (0.6, 1.2, 1.55, 2.4):
                    put(a + ft, impact(0.25), 0.18, 0.2)
                    put(a + ft, click(3000, dur=0.03), 0.18, 0.2)
                stamp(mix, a + min(3.3, d * 0.5))
            elif key == (1, 1):
                put(a + 0.2, riser(2.0, 200, 1800), 0.06)
                put(a + 1.2, pop(500, 240), 0.2)
                put(a + 2.6, blip(110, dur=0.5), 0.12)
            elif key == (1, 2):
                for i in range(3):
                    put(a + 0.1 + i * 0.4, whoosh(0.35, 3000, 900, peak=0.4), 0.08, 0.4)
                put(a + 1.6, whoosh(1.0, 400, 1600, peak=0.3), 0.07)
                stamp(mix, a + min(3.6, d * 0.55))
            elif si == 1:
                stamp(mix, a + 0.4, 0.7)
                if bi == 0:
                    put(a, chime([587.33, 880.0], dur=1.4, tau=0.4), 0.05)
                if bi == 2:
                    for k in range(8):
                        put(a + 0.4 + k * 0.6, whoosh(0.5, 1800, 300, peak=0.3), 0.04, (k % 3 - 1) * 0.5)
            elif key == (3, 0):
                put(a + 2.0, scratch(1.4), 0.08)
                stamp(mix, a + min(3.8, d * 0.6))
            elif key == (3, 1):
                put(a + 1.4, scratch(0.8), 0.12)
                put(a + 2.6, whoosh(1.4, 1200, 200, peak=0.6), 0.12)
                put(a + 3.8, impact(0.8), 0.15)
            elif key == (3, 2):
                put(a + 0.6, pop(900, 400), 0.2, 0.4)
                stamp(mix, a + 1.7)
                fl = max(3.4, d * 0.62)

                put(a + fl, whoosh(0.7, 900, 3000, peak=0.4), 0.12)
                put(a + fl + 0.6, pop(1100, 600), 0.2, 0.4)
            elif key == (3, 3):
                for k in range(4):
                    put(a + 1.2 + k * 0.12, blip(1318.5 + k * 120, dur=0.25, tau=0.06), 0.06, -0.4 + k * 0.25)
                put(a + 3.6, impact(0.6), 0.15)
                put(a + 3.6, scratch(0.6), 0.1)
            elif key == (4, 0):
                put(a - 0.2, whoosh(1.0, 300, 2400, peak=0.4), 0.1, 0.5)
                put(a + 0.6, whoosh(1.0, 2400, 300, peak=0.4), 0.1, -0.5)
            elif key == (4, 1):
                put(a + 0.9, whoosh(0.5, 2000, 200, peak=0.6), 0.12)
                put(a + 1.35, impact(1.4), 0.3)
            elif key == (4, 2):
                put(a + 0.4, scratch(max(2.0, d - 0.8)), 0.035)
                for k in range(int(d)):
                    put(a + 0.5 + k, click(1800, dur=0.03), 0.06, 0.1)
            elif key == (4, 3):
                put(a, scratch(1.6), 0.06)
                for i in range(4):
                    put(a + 1.6 + i * 0.35, whoosh(0.8, 300, 2600, peak=0.4), 0.09, [0.6, -0.6, 0.5, -0.5][i])
                put(a + 3.2, impact(1.2), 0.22)
            elif key == (5, 0):
                put(a - 0.2, pop(400, 900, dur=0.3), 0.2)
                df = max(3, d * 0.6)
                put(a + df, whoosh(1.2, 1600, 200, peak=0.5), 0.12)
            elif key == (5, 1):
                for i in range(4):
                    put(a + 1.4 + i * 0.55, scratch(0.3), 0.12, 0.3)
                    put(a + 1.4 + i * 0.55, click(1500, dur=0.04), 0.14, 0.3)
                stamp(mix, a + 4.0)
            elif key == (5, 2):
                put(a + 2.0, impact(0.7), 0.22)
                put(a + 2.0, click(2600, dur=0.05), 0.24, -0.4)
                put(a + 2.05, click(2400, dur=0.05), 0.24, 0.4)
            elif key == (5, 3):
                put(a + 1.2, whoosh(max(2.5, d - 1.5), 600, 120, peak=0.5, q=0.5), 0.1, -0.3)
                put(a + 1.8, whoosh(2.0, 500, 1500, peak=0.3), 0.06, 0.5)

    # the final question: darker, a single deep hit
    put(Q["t0"] - 1.0, riser(1.0, 200, 2400), 0.14)
    put(Q["t0"] + 0.1, impact(2.2), 0.34)
    put(Q["t0"] + 0.12, pop(500, 200), 0.28)
    # closing line
    put(E["t0"] + 0.05, whoosh(0.6, 2800, 500, peak=0.5), 0.13)
    stamp(mix, E["b"] - 0.2, 1.2)
    # outro: logo
    put(O["t0"] + 0.1, chime([587.33, 880.0, 1174.66], dur=2.4, tau=0.9), 0.14)
    put(O["t0"] + 0.35, whoosh(0.75, 500, 4000, peak=0.4), 0.1)
    put(O["t0"] + 0.9, pop(1200, 700), 0.16)
