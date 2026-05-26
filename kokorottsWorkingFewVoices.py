# deploy.py — Kokoro-82M on Modal
# Deploy:  modal deploy kokorotts.py
# Serve:   modal serve kokorotts.py   (ephemeral, dev)
# Test:    modal run   kokorotts.py   (single synthesis, exits)

import io
import modal

# ---------------------------------------------------------------------------
# 1. Container image
#    Key: apt_install("espeak-ng") — kokoro's hard system dependency.
#    Without it, misaki's English G2P fallback crashes at runtime.
# ---------------------------------------------------------------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("espeak-ng")
    .pip_install(
        "kokoro>=0.9.4",
        "misaki[en]",       # swap/add [ja] or [zh] for Japanese/Mandarin
        "soundfile",
        "numpy",
        "fastapi[standard]",
    )
)

app = modal.App("kokoro-tts", image=image)

# ---------------------------------------------------------------------------
# 2. GPU class — pipeline loaded once at container start, reused across calls
#    FIXED: container_idle_timeout → scaledown_window (deprecated Feb 2025)
#    FIXED: keep_warm → min_containers (deprecated, old autoscaler API)
# ---------------------------------------------------------------------------
@app.cls(
    gpu="T4",                  # T4 is sufficient; use A10G for lower latency
    scaledown_window=300,      # keep warm 5 min after last request (was container_idle_timeout)
    timeout=120,               # max seconds per synthesis call
    # min_containers=1,        # uncomment to eliminate cold starts (~$14/day)
)
class KokoroTTS:

    @modal.enter()
    def load(self):
        """Runs once when the container boots. Model stays in GPU memory."""
        from kokoro import KPipeline
        # lang_code controls the G2P backend.
        # 'a' = American English  'b' = British  'e' = Spanish  'f' = French
        # 'h' = Hindi  'i' = Italian  'j' = Japanese  'p' = Portuguese  'z' = Mandarin
        self.pipeline = KPipeline(lang_code="a")
        print("[kokoro] pipeline ready")

    @modal.method()
    def synthesize(
        self,
        text: str,
        voice: str = "af_heart",
        speed: float = 1.0,
        fmt: str = "wav",          # "wav" | "pcm"
        lang_code: str = "a",      # must match the pipeline's lang_code
    ) -> bytes:
        """
        Convert text → audio bytes (WAV or raw float32 PCM at 24 kHz).

        Pronunciation override syntax: [word](/IPA/)
        Example: "Visit [Nike](/nˈaɪki/) today."
        """
        import numpy as np
        import soundfile as sf

        # Re-init pipeline if a different language is requested
        # (for multi-lang production, extend this class with per-lang pipelines)
        if lang_code != "a":
            from kokoro import KPipeline
            pipeline = KPipeline(lang_code=lang_code)
        else:
            pipeline = self.pipeline

        chunks = []
        for _i, (_gs, _ps, audio) in enumerate(
            pipeline(text, voice=voice, speed=speed, split_pattern=r"\n+")
        ):
            chunks.append(audio)

        if not chunks:
            return b""

        combined = np.concatenate(chunks)

        if fmt == "pcm":
            return combined.astype(np.float32).tobytes()

        buf = io.BytesIO()
        sf.write(buf, combined, samplerate=24000, format="WAV")
        buf.seek(0)
        return buf.read()


# ---------------------------------------------------------------------------
# 3. FastAPI web endpoint
#    FIXED: removed duplicate gpu= and image= (already set on the App image)
#    FIXED: call KokoroTTS().synthesize.remote() correctly via modal.Cls lookup
#    FIXED: @modal.concurrent goes on the ASGI function, not the Cls
# ---------------------------------------------------------------------------
@app.function(
    scaledown_window=300,      # keep warm 5 min after last request
)
@modal.concurrent(max_inputs=10)   # 10 parallel requests per container
@modal.asgi_app()
def web():
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import Response
    from pydantic import BaseModel, Field

    api = FastAPI(title="Kokoro TTS", version="1.0.0")

    # ── request schema ────────────────────────────────────────────────────
    class TTSRequest(BaseModel):
        text: str       = Field(..., max_length=10_000)
        voice: str      = Field("af_heart")
        speed: float    = Field(1.0, ge=0.5, le=2.0)
        format: str     = Field("wav", pattern="^(wav|pcm)$")
        lang_code: str  = Field("a")

    # ── routes ────────────────────────────────────────────────────────────
    @api.get("/health")
    def health():
        return {"status": "ok", "model": "kokoro-82m", "sample_rate": 24000}

    @api.get("/voices")
    def voices():
        return {
            "voices": {
                "american_female": ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky"],
                "american_male":   ["am_adam", "am_michael"],
                "british_female":  ["bf_emma", "bf_isabella"],
                "british_male":    ["bm_george", "bm_lewis"],
            }
        }

    @api.post("/synthesize")
    def synthesize(req: TTSRequest):
        if not req.text.strip():
            raise HTTPException(400, "text must not be empty")

        tts = KokoroTTS()
        audio = tts.synthesize.remote(
            text=req.text,
            voice=req.voice,
            speed=req.speed,
            fmt=req.format,
            lang_code=req.lang_code,
        )

        media = "audio/wav" if req.format == "wav" else "audio/pcm"
        return Response(content=audio, media_type=media)

    return api


# ---------------------------------------------------------------------------
# 4. CLI test — modal run kokorotts.py [--text "..."] [--voice af_heart]
# ---------------------------------------------------------------------------
@app.local_entrypoint()
def main(
    text:   str = "Kokoro is an open-weight TTS model with 82 million parameters.",
    voice:  str = "af_heart",
    output: str = "/tmp/kokoro.wav",
):
    tts = KokoroTTS()
    data = tts.synthesize.remote(text=text, voice=voice)
    with open(output, "wb") as f:
        f.write(data)
    print(f"✓ saved → {output}  ({len(data):,} bytes)")