from faster_whisper import WhisperModel
import sys, numpy as np, wave
w=wave.open("audio/voice16.wav"); A=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
m = WhisperModel(sys.argv[1], device="cpu", compute_type="int8", cpu_threads=4)
segs, info = m.transcribe(A, beam_size=1, without_timestamps=True, clip_timestamps=[0, 30])
print(info.language, info.language_probability)
print(sorted(info.all_language_probs, key=lambda x: -x[1])[:5])
for s in segs: print(s.text)
