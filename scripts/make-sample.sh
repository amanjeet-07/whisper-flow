#!/usr/bin/env bash
# Regenerates assets/sample.wav on macOS using the offline `say` TTS engine,
# then converts to 16 kHz / 16-bit / mono WAV with afconvert.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$script_dir/../assets/sample.wav"
tmp="$(mktemp -d)/sample.aiff"

sentence="um, hello there, uh, this is like a test of the, you know, local dictation pipeline"

say -o "$tmp" "$sentence"
afconvert -f WAVE -d LEI16@16000 -c 1 "$tmp" "$out"
rm -f "$tmp"

echo "Wrote $out"
