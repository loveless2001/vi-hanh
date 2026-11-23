"""Render the Vi Hành intro score to a stereo WAV. Usage: python intro_score.py out.wav"""
import sys
import wave

import numpy as np


RATE = 44100
END = 106.5
BEAT = 0.75
TAU = 2 * np.pi
mix = np.zeros((round(RATE * END), 2), dtype=np.float32)


def voice(at, key, beats, level, pan, sound):
    start = round(at * RATE)
    hold = beats * BEAT
    tail = {"pad": 0.95, "pluck": 0.38, "chip": 0.16, "bass": 0.22}[sound]
    length = min(len(mix) - start, round((hold + tail) * RATE))
    if length <= 0:
        return
    t = np.arange(length) / RATE
    phase = TAU * (440 * 2 ** ((key - 69) / 12)) * t
    # Different releases let the wood resonate while the pixel notes end crisply.
    release = np.cos(np.minimum(np.maximum(t - hold, 0) / tail, 1) * np.pi / 2) ** 2
    if sound == "pad":
        gain = np.minimum(t / 0.68, 1) ** 1.4 * release
        tone = (0.54 * np.sin(phase) + 0.28 * np.sin(phase * 1.0021 + 0.6)
                + 0.15 * np.sin(2 * phase * 0.9987) + 0.06 * np.sin(3 * phase))
    elif sound == "pluck":
        gain = (1 - np.exp(-t / 0.008)) * np.exp(-1.75 * t) * release
        tone = (np.sin(phase) + 0.34 * np.exp(-t * 6) * np.sin(2.01 * phase)
                + 0.23 * np.exp(-t * 13) * np.sin(3.96 * phase))
    elif sound == "chip":
        gain = (1 - np.exp(-t / 0.014)) * (0.56 + 0.44 * np.exp(-5 * t)) * release
        tone = (np.sin(phase) + 0.19 * np.sin(3 * phase) + 0.09 * np.sin(5 * phase)
                + 0.035 * np.sin(7 * phase))
    else:
        gain = (1 - np.exp(-t / 0.024)) * np.exp(-1.1 * t) * release
        tone = np.sin(phase) + 0.19 * np.sin(phase * 2)
    signal = level * gain * tone
    angle = (pan + 1) * np.pi / 4
    mix[start:start + length, 0] += signal * np.cos(angle)
    mix[start:start + length, 1] += signal * np.sin(angle)


# Four beats per bar. Each phrase lists beat, MIDI note and held beats.
tea = [(0, 62, 0.8), (1.5, 69, 0.42), (2.25, 67, 1.2)]
answer = [(0.5, 65, 0.8), (2, 64, 0.45), (2.75, 62, 1.05)]
question = [(0.5, 69, 0.38), (1.25, 72, 0.55), (2.75, 74, 0.85)]
paper = [(0, 74, 0.48), (0.75, 76, 0.28), (1.5, 72, 0.72), (3, 69, 0.5)]
pages = [(0.5, 67, 0.6), (1.75, 69, 0.45), (2.5, 65, 1.15)]
machine = [(0.25, 64, 0.26), (0.75, 67, 0.3), (1.5, 69, 0.5), (3.25, 64, 0.32)]
descending = [(0, 69, 1.1), (1.5, 67, 0.8), (2.75, 62, 1.0)]

# (bar, phrase, semitone shift). Pauses and answers are part of the melody.
melody = [
    (0, tea, 0), (1, answer, 0), (2, question, -5), (3, [(1, 69, 1.2)], 0),
    (4, [(2, 65, 0.6), (3.25, 64, 0.4)], 0), (5, tea, 0), (6, answer, 0),
    (7, paper, 0), (8, pages, 0), (9, question, 0), (10, [(2, 76, 1)], 0),
    (11, paper, -7), (12, pages, 0), (13, question, -5), (14, [(0, 69, 1.5)], 0),
    (15, tea, -12), (16, pages, -5), (17, [(1.5, 64, 1.1)], 0),
    (18, question, -5), (19, answer, 0), (20, machine, 0), (21, pages, 0),
    (22, machine, 5), (23, [(0, 76, 0.35), (0.75, 74, 0.35), (2, 69, 1.0)], 0),
    (24, tea, 0), (25, descending, 0), (26, answer, -5),
    (27, [(0, 62, 1.4), (2.25, 57, 0.9)], 0),
    (30, tea, 12), (31, answer, 12), (32, pages, 0),
    (33, tea, 0), (34, [(0, 66, 0.75), (1.25, 64, 0.5), (2.5, 62, 2.3)], 0),
]
for bar, phrase, shift in melody:
    bright = 7 <= bar <= 14 or 20 <= bar <= 23 or 30 <= bar <= 32
    for i, (beat, note, held) in enumerate(phrase):
        voice((bar * 4 + beat) * BEAT + (0.035 if i % 2 else 0.015),
              note + shift, held, (0.117 if bright else 0.18) * (1 - 0.07 * (i % 3)),
              0.11 if bright else -0.12, "chip" if bright else "pluck")

# Bass below open, widely spaced voicings. The seal interrupts an unresolved A.
voicings = {
    "d": (38, [53, 57, 64]), "g": (43, [53, 57, 62]),
    "f": (41, [52, 57, 60]), "c": (36, [52, 55, 62]),
    "a": (45, [52, 55, 62]), "D": (38, [54, 57, 64]),
}
changes = "d g f a d c g d c f g d f g a d c a g d c g f a d g f a a - D g c g D D".split()
for bar, chord in enumerate(changes):
    if chord == "-":
        continue
    at = bar * 4 * BEAT
    root, notes = voicings[chord]
    for i, key in enumerate(notes):
        voice(at + i * 0.056, key, 3.82, 0.055, [-0.60, 0.50, 0.20][i], "pad")
    voice(at + 0.04, root, 2.0, 0.128, 0, "bass")
    if 7 <= bar <= 13 or 18 <= bar <= 24:
        # A quiet offbeat answer with a wooden attack, opposite the chip melody.
        for beat, key in [(1.75, notes[1]), (3.5, notes[2])]:
            voice(at + beat * BEAT, key + 12, 0.34, 0.064, -0.44, "pluck")
    if bar in (2, 6, 9, 12, 19, 22, 25, 31):
        voice(at + 2.55 * BEAT, root + 7, 0.8, 0.066, 0.10, "bass")

# Small stereo room, followed by picture-locked rests for cup and stamp.
dry = mix.copy()
for delay, amount in [(0.087, 0.095), (0.149, 0.075), (0.257, 0.045), (0.421, 0.027)]:
    offset = round(RATE * delay)
    mix[offset:] += dry[:-offset, ::-1] * amount
del dry
clock = np.arange(len(mix)) / RATE
level = np.interp(clock, [0, 0.6, 11.85, 12.18, 12.55, 13.2, 80, 83.4, 85.4, 89.5,
                          90.4, 94.8, 95.6, 96.6, 103.9, END],
                  [0, 1, 1, 0.32, 0.32, 1, 1, 0.8, 0, 0, 0.85, 1, 0.45, 0.85, 1, 0])
mix *= level[:, None]
with wave.open(sys.argv[1], "wb") as out:
    out.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
    out.writeframes((mix * 32767).clip(-32768, 32767).astype("<i2").tobytes())
