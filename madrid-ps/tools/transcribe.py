# Pashto transcript with word timestamps (faster-whisper); used only to time-align the known script.
import sys, json, wave, numpy as np
from faster_whisper import WhisperModel
w = wave.open("audio/voice16.wav"); A = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel(sys.argv[1], download_root="/home/user/.cache/fw", device="cpu", compute_type="int8", cpu_threads=4)
segs, info = m.transcribe(A, language="ps", beam_size=5, word_timestamps=True, condition_on_previous_text=False, vad_filter=False)
out = []
for s in segs:
    print(f"{s.start:7.2f} {s.end:7.2f} {s.text}", flush=True)
    out.append({"a": s.start, "b": s.end, "text": s.text, "words": [[x.word, x.start, x.end, x.probability] for x in s.words]})
json.dump(out, open(f"data/whisper_{sys.argv[1]}.json", "w"), ensure_ascii=False)
