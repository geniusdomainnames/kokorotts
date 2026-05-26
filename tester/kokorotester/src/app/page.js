"use client";

// src/app/page.js

import { useState, useRef } from "react";

const VOICES = {
  "🇺🇸 American Female": [
    { id: "af_heart",   label: "Heart",   grade: "A"  },
    { id: "af_bella",   label: "Bella",   grade: "A-" },
    { id: "af_nicole",  label: "Nicole",  grade: "B-" },
    { id: "af_aoede",   label: "Aoede",   grade: "C+" },
    { id: "af_kore",    label: "Kore",    grade: "C+" },
    { id: "af_sarah",   label: "Sarah",   grade: "C+" },
    { id: "af_alloy",   label: "Alloy",   grade: "C"  },
    { id: "af_nova",    label: "Nova",    grade: "C"  },
    { id: "af_jessica", label: "Jessica", grade: "D"  },
    { id: "af_river",   label: "River",   grade: "D"  },
    { id: "af_sky",     label: "Sky",     grade: "C-" },
  ],
  "🇺🇸 American Male": [
    { id: "am_fenrir",  label: "Fenrir",  grade: "C+" },
    { id: "am_michael", label: "Michael", grade: "C+" },
    { id: "am_puck",    label: "Puck",    grade: "C+" },
    { id: "am_echo",    label: "Echo",    grade: "D"  },
    { id: "am_eric",    label: "Eric",    grade: "D"  },
    { id: "am_liam",    label: "Liam",    grade: "D"  },
    { id: "am_onyx",    label: "Onyx",    grade: "D"  },
    { id: "am_santa",   label: "Santa",   grade: "D-" },
    { id: "am_adam",    label: "Adam",    grade: "F+" },
  ],
  "🇬🇧 British Female": [
    { id: "bf_emma",     label: "Emma",     grade: "B-" },
    { id: "bf_isabella", label: "Isabella", grade: "C"  },
    { id: "bf_alice",    label: "Alice",    grade: "D"  },
    { id: "bf_lily",     label: "Lily",     grade: "D"  },
  ],
  "🇬🇧 British Male": [
    { id: "bm_fable",  label: "Fable",  grade: "C"  },
    { id: "bm_george", label: "George", grade: "C"  },
    { id: "bm_lewis",  label: "Lewis",  grade: "D+" },
    { id: "bm_daniel", label: "Daniel", grade: "D"  },
  ],
  "🇯🇵 Japanese Female": [
    { id: "jf_alpha",      label: "Alpha",     grade: "C+" },
    { id: "jf_gongitsune", label: "Gongitsune",grade: "C"  },
    { id: "jf_tebukuro",   label: "Tebukuro",  grade: "C"  },
    { id: "jf_nezumi",     label: "Nezumi",    grade: "C-" },
  ],
  "🇯🇵 Japanese Male": [
    { id: "jm_kumo", label: "Kumo", grade: "C-" },
  ],
  "🇨🇳 Mandarin Female": [
    { id: "zf_xiaobei",  label: "Xiaobei",  grade: "D" },
    { id: "zf_xiaoni",   label: "Xiaoni",   grade: "D" },
    { id: "zf_xiaoxiao", label: "Xiaoxiao", grade: "D" },
    { id: "zf_xiaoyi",   label: "Xiaoyi",   grade: "D" },
  ],
  "🇨🇳 Mandarin Male": [
    { id: "zm_yunjian", label: "Yunjian", grade: "D" },
    { id: "zm_yunxi",   label: "Yunxi",   grade: "D" },
    { id: "zm_yunxia",  label: "Yunxia",  grade: "D" },
    { id: "zm_yunyang", label: "Yunyang", grade: "D" },
  ],
  "🇪🇸 Spanish": [
    { id: "ef_dora",  label: "Dora (F)",  grade: "—" },
    { id: "em_alex",  label: "Alex (M)",  grade: "—" },
    { id: "em_santa", label: "Santa (M)", grade: "—" },
  ],
  "🇫🇷 French": [
    { id: "ff_siwis", label: "Siwis (F)", grade: "B-" },
  ],
  "🇮🇳 Hindi Female": [
    { id: "hf_alpha", label: "Alpha", grade: "C" },
    { id: "hf_beta",  label: "Beta",  grade: "C" },
  ],
  "🇮🇳 Hindi Male": [
    { id: "hm_omega", label: "Omega", grade: "C" },
    { id: "hm_psi",   label: "Psi",   grade: "C" },
  ],
  "🇮🇹 Italian": [
    { id: "if_sara",    label: "Sara (F)",   grade: "C" },
    { id: "im_nicola",  label: "Nicola (M)", grade: "C" },
  ],
  "🇧🇷 Portuguese": [
    { id: "pf_dora",  label: "Dora (F)",  grade: "—" },
    { id: "pm_alex",  label: "Alex (M)",  grade: "—" },
    { id: "pm_santa", label: "Santa (M)", grade: "—" },
  ],
};

// Flat map for label lookup
const ALL_VOICES = Object.values(VOICES).flat();

export default function Home() {
  const [text, setText]         = useState("");
  const [voice, setVoice]       = useState("af_heart");
  const [speed, setSpeed]       = useState(1.0);
  const [loading, setLoading]   = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError]       = useState(null);
  const audioRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const charCount = text.length;
  const selectedVoice = ALL_VOICES.find(v => v.id === voice);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #0a0a0f;
          --surface:  #111118;
          --border:   #1e1e2e;
          --accent:   #c8f03c;
          --accent2:  #f03c8c;
          --muted:    #44445a;
          --text:     #e8e8f0;
          --text-dim: #55556a;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 99;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .glow-orb {
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,240,60,0.06) 0%, transparent 70%);
          top: -200px; right: -150px;
          pointer-events: none;
        }
        .glow-orb2 {
          position: fixed;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240,60,140,0.05) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .wrapper {
          max-width: 760px;
          margin: 0 auto;
          padding: 60px 24px 100px;
        }

        header { margin-bottom: 56px; }

        .eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        h1 {
          font-size: clamp(42px, 8vw, 72px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
        }

        h1 span { color: var(--accent); }

        .subtitle {
          margin-top: 16px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--text-dim);
          font-weight: 300;
        }

        .voice-count {
          display: inline-block;
          margin-top: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--accent);
          background: rgba(200,240,60,0.07);
          border: 1px solid rgba(200,240,60,0.15);
          border-radius: 3px;
          padding: 3px 8px;
          letter-spacing: 0.1em;
        }

        form { display: flex; flex-direction: column; gap: 28px; }

        .field label {
          display: block;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-dim);
          font-family: 'DM Mono', monospace;
          margin-bottom: 10px;
        }

        textarea {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          padding: 18px 20px;
          resize: vertical;
          min-height: 160px;
          transition: border-color 0.2s;
          outline: none;
        }
        textarea::placeholder { color: #33334a; }
        textarea:focus { border-color: var(--accent); }

        .char-count {
          text-align: right;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #33334a;
          margin-top: 6px;
        }
        .char-count.warn { color: var(--accent2); }

        .controls-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* Voice selector with custom styling */
        .voice-select-wrapper {
          position: relative;
        }

        select {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          padding: 14px 40px 14px 16px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2355556a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        select:focus { border-color: var(--accent); }
        optgroup {
          color: var(--text-dim);
          font-size: 11px;
          font-style: normal;
          background: #0d0d15;
        }
        option {
          background: #111118;
          color: var(--text);
          padding: 4px 0;
        }

        /* Voice badge shown below select */
        .voice-badge {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }
        .grade-pill {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 3px;
          border: 1px solid rgba(200,240,60,0.2);
          color: var(--accent);
          background: rgba(200,240,60,0.05);
        }
        .grade-pill.low {
          border-color: rgba(240,60,140,0.2);
          color: var(--accent2);
          background: rgba(240,60,140,0.05);
        }

        .speed-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .speed-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .speed-val {
          font-family: 'DM Mono', monospace;
          font-size: 20px;
          font-weight: 400;
          color: var(--accent);
        }

        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          background: var(--border);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          margin-top: 8px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }

        .speed-labels {
          display: flex;
          justify-content: space-between;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #33334a;
        }

        button[type=submit] {
          background: var(--accent);
          color: #0a0a0f;
          border: none;
          border-radius: 4px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 18px 32px;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
          position: relative;
          overflow: hidden;
        }
        button[type=submit]:hover:not(:disabled) { transform: translateY(-2px); }
        button[type=submit]:active:not(:disabled) { transform: translateY(0); }
        button[type=submit]:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0a0a0f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .audio-panel {
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: 4px;
          padding: 24px;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .audio-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }

        audio {
          width: 100%;
          height: 40px;
          accent-color: var(--accent);
        }

        .audio-meta {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #33334a;
        }

        .download-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .download-btn:hover { opacity: 0.7; }

        .error-box {
          background: rgba(240,60,140,0.08);
          border: 1px solid rgba(240,60,140,0.3);
          border-radius: 4px;
          padding: 16px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--accent2);
        }

        @media (max-width: 520px) {
          .controls-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="grain" />
      <div className="glow-orb" />
      <div className="glow-orb2" />

      <div className="wrapper">
        <header>
          <p className="eyebrow">Kokoro · 82M · Neural TTS</p>
          <h1>Type.<br /><span>Hear.</span></h1>
          <p className="subtitle">// powered by kokoro-82m via modal.com</p>
          <span className="voice-count">54 voices · 9 languages</span>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Text to synthesize</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste or type anything here..."
              maxLength={10000}
            />
            <p className={`char-count ${charCount > 8000 ? "warn" : ""}`}>
              {charCount.toLocaleString()} / 10,000
            </p>
          </div>

          <div className="controls-row">
            <div className="field">
              <label>Voice</label>
              <div className="voice-select-wrapper">
                <select value={voice} onChange={e => setVoice(e.target.value)}>
                  {Object.entries(VOICES).map(([group, voices]) => (
                    <optgroup key={group} label={group}>
                      {voices.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.label}{v.grade && v.grade !== "—" ? ` · ${v.grade}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedVoice && (
                  <div className="voice-badge">
                    <span>{selectedVoice.id}</span>
                    {selectedVoice.grade && selectedVoice.grade !== "—" && (
                      <span className={`grade-pill ${["D","D-","F+","D+"].includes(selectedVoice.grade) ? "low" : ""}`}>
                        {selectedVoice.grade}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="field">
              <label>Speed</label>
              <div className="speed-wrapper">
                <div className="speed-display">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-dim)" }}>
                    {speed <= 0.8 ? "slow" : speed >= 1.5 ? "fast" : "normal"}
                  </span>
                  <span className="speed-val">{speed.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0.5" max="2.0" step="0.1"
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                />
                <div className="speed-labels">
                  <span>0.5×</span>
                  <span>1.0×</span>
                  <span>2.0×</span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !text.trim()}>
            <span className="btn-inner">
              {loading ? (
                <>
                  <span className="spinner" />
                  Synthesizing...
                </>
              ) : (
                "Generate Audio"
              )}
            </span>
          </button>
        </form>

        {error && (
          <div className="error-box" style={{ marginTop: 28 }}>
            ✗ {error}
          </div>
        )}

        {audioUrl && !loading && (
          <div className="audio-panel" style={{ marginTop: 28 }}>
            <p className="audio-label">▶ Output ready</p>
            <audio ref={audioRef} controls src={audioUrl} />
            <div className="audio-meta">
              <span>{selectedVoice?.label} · {speed.toFixed(1)}×</span>
              <a className="download-btn" href={audioUrl} download="kokoro-output.wav">
                ↓ download wav
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}