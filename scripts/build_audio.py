#!/usr/bin/env python3
"""Build coherent online English audio clips for GitHub Pages."""
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

TENS = "twenty thirty forty fifty sixty seventy eighty ninety".split()
DIGITS = "one two three four five six seven eight nine".split()
COMMON_PHRASES = [
    "the time is", "phone number", "the price is", "oh sorry i mean",
    "please set the speed to", "the quantity is", "the train leaves at",
    "but it's delayed by", "what is the new time", "a technician has",
    "how many", "are there now", "are left", "make that",
    "one hundred", "two hundred", "three hundred", "four hundred",
    "five hundred", "six hundred", "seven hundred", "eight hundred",
    "nine hundred",
]
PHRASE_TEXTS = [
    *(f"{tens} {digit}" for tens in TENS for digit in DIGITS),
    *(f"{digit} thousand" for digit in DIGITS),
    *COMMON_PHRASES,
]

def phrase_key(phrase: str) -> str:
    return "_".join(key_of(word) for word in PATTERN.findall(phrase))

def phrases() -> dict[str, str]:
    return {phrase_key(text): text for text in PHRASE_TEXTS}



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
    """Preserve quiet consonants at the start/end; shorten only long trailing silence."""
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

        # Preserve the complete onset (including weak /f/, /s/, /th/).
        # Soft final consonants may continue after louder speech has ended.
        active = [i for i, sample in enumerate(samples) if abs(sample) > 40]
        if not active:
            raise RuntimeError(f"Silent audio samples for {word!r}")
        tail = int(16000 * 0.090)
        end = min(len(samples), max(int(16000 * 0.150), active[-1] + tail))
        return samples[:end].tobytes()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    words = vocabulary()
    combos = phrases()
    if len(words) < 70 or len(combos) < 90:
        raise RuntimeError(f"Unexpected vocabulary sizes: {len(words)} / {len(combos)}")
    totals = {}
    for locale, voice in {"en-US": "en-us", "en-GB": "en-gb"}.items():
        folder = OUT / locale
        folder.mkdir(parents=True, exist_ok=True)
        total = 0
        for key, spoken in {**words, **combos}.items():
            pcm = pcm_for_word(spoken, voice)
            (folder / f"{key}.pcm").write_bytes(pcm)
            total += len(pcm)
        totals[locale] = total
    manifest = {
        "version": 2,
        "sampleRate": 16000,
        "voices": ["en-US", "en-GB"],
        "tokenCount": len(words),
        "tokens": sorted(words),
        "phrases": [
            {"key": key, "words": [key_of(w) for w in PATTERN.findall(spoken)]}
            for key, spoken in combos.items()
        ],
        "totalBytes": totals,
        "engine": "eSpeak NG whole-phrase clips generated at build time",
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Generated {len(words)} tokens + {len(combos)} phrases x 2 voices: {totals}")


if __name__ == "__main__":
    main()
