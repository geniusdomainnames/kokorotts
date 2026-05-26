// src/app/api/synthesize/route.js

export async function POST(request) {
  const { text, voice, speed } = await request.json();

  if (!text || !text.trim()) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  // lang_code is intentionally omitted — the Modal backend auto-detects
  // it from the voice name via the VOICE_TO_LANG lookup table.
  // Passing lang_code: "a" would break non-English voices.
  const modalRes = await fetch(
    "https://geniusdomainnames--kokoro-tts-web.modal.run/synthesize",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: voice || "af_heart",
        speed: speed || 1.0,
        format: "wav",
        // lang_code: auto-detected server-side
      }),
    }
  );

  if (!modalRes.ok) {
    const err = await modalRes.text();
    return Response.json({ error: err }, { status: modalRes.status });
  }

  const audioBuffer = await modalRes.arrayBuffer();

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.byteLength,
    },
  });
}