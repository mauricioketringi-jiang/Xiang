#!/usr/bin/env python3
"""Build small, individually streamed PCM voice tokens for GitHub Pages."""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio"
NUMBERS = """zero oh one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion and double triple point percent quarter past half to o'clock""".split()
CONTEXT = """the time is phone number flight postcode price dollars sorry i mean please set speed no correction quantity actually make that train leaves at but it's delayed by minutes what new a technician has parts receives uses more how many are there now left oclock not today""".split()
LETTERS = list("abcdefghijklmnopqrstuvwxyz")
PATTERN = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)*")
MINIMUM = {"its": "it's", "oclock": "o'clock"}


def key_of(word: str) -> str:
    return re.sub(r"[^a-z]", "", word.lower())


def text_of(key: str) -> str:
    return MINIMUM.get(key, key)


def vocabulary() -> dict[str, str]:
    words: dict[str, str] = {}
    for word in [*NUMBERS, *CONTEXT, *LETTERS]:
        key = key_of(word)
        if key:
            words[key] = text_of(key)

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    # All built-in vocabulary audioText entries are static literal strings.
    for text in re.findall(r"audioText:'([^']+)'", html):
        for word in PATTERN.findall(text):
            key = key_of(word)
            if key:
                words[key] = text_of(key)

    return dict(sorted(words.items()))


def pcm_for_word(word: str, voice: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "generated.wav"
        subprocess.run(
            ["espeak-ng", "-v", voice, "-s", "164", "-w", str(wav), word],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
        )
        result = subprocess.run(
            ["ffmpeg", "-v", "error", "-nostdin", "-i", str(wav),
             "-ac", "1", "-ar", "16000", "-f", "s16le", "-acodec", "pcm_s16le", "-"],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        samples = array("h")
        samples.frombytes(result.stdout)
        if not samples:
            raise RuntimeError(f"No audio samples for {word!r}")
        # Trim prolonged eSpeak leading/trailing pauses, retaining a short natural margin.
        active = [i for i, sample in enumerate(samples) if abs(sample) > 200]
        if not active:
            raise RuntimeError(f"Silent audio samples for {word!r}")
        start = max(0, active[0] - 320)
        end = min(len(samples), active[-1] + 640)
        return samples[start:end].tobytes()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    words = vocabulary()
    if len(words) < 70:
        raise RuntimeError(f"Audio vocabulary unexpectedly small: {len(words)}")
    totals = {}
    for locale, voice in {"en-US": "en-us", "en-GB": "en-gb"}.items():
        folder = OUT / locale
        folder.mkdir(parents=True, exist_ok=True)
        total = 0
        for key, spoken in words.items():
            pcm = pcm_for_word(spoken, voice)
            (folder / f"{key}.pcm").write_bytes(pcm)
            total += len(pcm)
        totals[locale] = total
    manifest = {
        "version": 1,
        "sampleRate": 16000,
        "voices": ["en-US", "en-GB"],
        "tokenCount": len(words),
        "tokens": sorted(words),
        "totalBytes": totals,
        "engine": "eSpeak NG generated at build time",
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Generated {len(words)} tokens × 2 voices: {totals}")


if __name__ == "__main__":
    main()
