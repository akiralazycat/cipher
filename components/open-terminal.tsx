"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CipherPayload,
  fingerprintToken,
  hostFromUrl,
  openPayload,
  parseEnvelope,
} from "@/lib/cipher";

type Phase = "loading" | "code" | "ready" | "denied" | "expired" | "burned" | "launching";

function formatTimestamp(value: number | null) {
  if (!value) return "NO TIMER";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default function OpenTerminal() {
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [payload, setPayload] = useState<CipherPayload | null>(null);
  const [fingerprint, setFingerprint] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [errorPulse, setErrorPulse] = useState(false);

  const targetHost = useMemo(() => payload ? hostFromUrl(payload.url) : "SEALED", [payload]);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (!fragment) {
      setPhase("denied");
      return;
    }

    let cancelled = false;

    async function initialize() {
      try {
        const envelope = parseEnvelope(fragment);
        const mark = await fingerprintToken(fragment);
        if (cancelled) return;

        setToken(fragment);
        setFingerprint(mark);

        if (window.localStorage.getItem(`cipher:burn:${mark}`)) {
          setPhase("burned");
          return;
        }

        if (envelope.mode === "code") {
          setPhase("code");
          return;
        }

        await decrypt(fragment, "", mark);
      } catch {
        if (!cancelled) setPhase("denied");
      }
    }

    initialize();
    return () => { cancelled = true; };
    // decrypt is intentionally called once from the initial fragment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decrypt(sourceToken = token, sourceCode = code, mark = fingerprint) {
    try {
      const opened = await openPayload(sourceToken, sourceCode);

      if (opened.expiresAt && Date.now() > opened.expiresAt) {
        setPhase("expired");
        return;
      }

      setPayload(opened);
      if (opened.burnAfterReveal && mark) {
        window.localStorage.setItem(`cipher:burn:${mark}`, String(Date.now()));
      }
      setPhase("ready");
    } catch {
      setErrorPulse(true);
      setPhase("code");
      window.setTimeout(() => setErrorPulse(false), 520);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) return;
    await decrypt();
  }

  function launch() {
    if (!payload || phase === "launching") return;
    setPhase("launching");
    setCountdown(3);

    let remaining = 3;
    const interval = window.setInterval(() => {
      remaining -= 1;
      setCountdown(Math.max(remaining, 0));
      if (remaining <= 0) window.clearInterval(interval);
    }, 700);

    window.setTimeout(() => {
      window.location.assign(payload.url);
    }, 2200);
  }

  return (
    <main className="open-page">
      <div className="open-grid" aria-hidden="true" />
      <header className="terminal-header">
        <Link href="/" className="wordmark"><span className="wordmark-mark">C</span> CIPHER</Link>
        <div className="terminal-status"><span /> SECURE CHANNEL</div>
      </header>

      <section className={`terminal-card ${errorPulse ? "error-pulse" : ""}`}>
        <div className="terminal-index">
          <span>RX-01</span>
          <span>{fingerprint ? fingerprint.slice(0, 8).toUpperCase() : "--------"}</span>
        </div>

        {phase === "loading" && (
          <div className="terminal-center">
            <div className="scanner" />
            <span className="eyebrow">INTERCEPTING TRANSMISSION</span>
            <h1>Reading capsule…</h1>
          </div>
        )}

        {phase === "code" && (
          <div className="terminal-center">
            <div className="lock-glyph" aria-hidden="true"><i /><b>•••</b></div>
            <span className="eyebrow">CLEARANCE REQUIRED</span>
            <h1>Enter access code.</h1>
            <p>This transmission was sealed with a separate code. It is not carried inside the link.</p>
            <form className="code-form" onSubmit={submitCode}>
              <input
                autoFocus
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="ACCESS CODE"
                autoComplete="off"
                aria-label="Access code"
              />
              <button type="submit">DECRYPT</button>
            </form>
            {errorPulse && <small className="denied-copy">ACCESS DENIED / VERIFY CODE</small>}
          </div>
        )}

        {phase === "ready" && payload && (
          <div className="dossier">
            <div className="dossier-stamp">DECRYPTED</div>
            <span className="eyebrow">OPERATION</span>
            <h1>{payload.codename}</h1>
            {payload.briefing && <p className="briefing">{payload.briefing}</p>}

            <div className="dossier-meta">
              <div><small>TARGET</small><strong>{targetHost}</strong></div>
              <div><small>EXPIRES</small><strong>{formatTimestamp(payload.expiresAt)}</strong></div>
              <div><small>BURN</small><strong>{payload.burnAfterReveal ? "ARMED / THIS BROWSER" : "DISABLED"}</strong></div>
            </div>

            <button className="launch-button" type="button" onClick={launch}>
              PROCEED TO TARGET <span>↗</span>
            </button>
            <p className="microcopy">The full destination is intentionally hidden until you proceed.</p>
          </div>
        )}

        {phase === "launching" && (
          <div className="terminal-center launching">
            <span className="eyebrow">ROUTE ACQUIRED</span>
            <div className="countdown">{countdown}</div>
            <h1>Opening target.</h1>
          </div>
        )}

        {(phase === "denied" || phase === "expired" || phase === "burned") && (
          <div className="terminal-center terminal-failure">
            <div className="failure-code">×</div>
            <span className="eyebrow">TRANSMISSION UNAVAILABLE</span>
            <h1>{phase === "expired" ? "Capsule expired." : phase === "burned" ? "Capsule burned." : "Signal corrupted."}</h1>
            <p>
              {phase === "expired"
                ? "The sender-defined access window has ended."
                : phase === "burned"
                  ? "This browser already revealed a burn-after-reveal capsule."
                  : "No readable Cipher payload was found in this link."}
            </p>
            <Link className="return-link" href="/">CREATE A NEW TRANSMISSION ↗</Link>
          </div>
        )}
      </section>

      <footer className="terminal-footer">
        <span>DESTINATION DATA: FRAGMENT-SEALED</span>
        <span>NO SERVER RECORD BY CIPHER</span>
      </footer>
    </main>
  );
}
