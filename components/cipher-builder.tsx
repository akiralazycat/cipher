"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CipherPayload,
  hostFromUrl,
  sealPayload,
  validateHttpUrl,
} from "@/lib/cipher";

const expiryOptions = [
  { label: "10 min", value: "600" },
  { label: "1 hour", value: "3600" },
  { label: "24 hours", value: "86400" },
  { label: "7 days", value: "604800" },
  { label: "No timer", value: "0" },
];

export default function CipherBuilder() {
  const [url, setUrl] = useState("");
  const [codename, setCodename] = useState("NIGHTFALL");
  const [briefing, setBriefing] = useState("");
  const [passcode, setPasscode] = useState("");
  const [expiry, setExpiry] = useState("86400");
  const [burnAfterReveal, setBurnAfterReveal] = useState(true);
  const [sealedLink, setSealedLink] = useState("");
  const [status, setStatus] = useState<"idle" | "sealing" | "ready" | "copied" | "error">("idle");
  const [error, setError] = useState("");

  const destinationHost = useMemo(() => (url ? hostFromUrl(url) : "destination hidden"), [url]);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!validateHttpUrl(url)) {
      setError("Enter a valid http:// or https:// destination.");
      setStatus("error");
      return;
    }

    setStatus("sealing");

    try {
      const seconds = Number(expiry);
      const now = Date.now();
      const payload: CipherPayload = {
        url: url.trim(),
        codename: codename.trim() || "UNTITLED",
        briefing: briefing.trim(),
        createdAt: now,
        expiresAt: seconds > 0 ? now + seconds * 1000 : null,
        burnAfterReveal,
      };

      const token = await sealPayload(payload, passcode);
      const origin = window.location.origin;
      setSealedLink(`${origin}/open#${token}`);
      setStatus("ready");
    } catch {
      setError("The capsule could not be sealed in this browser.");
      setStatus("error");
    }
  }

  async function copyLink() {
    if (!sealedLink) return;
    await navigator.clipboard.writeText(sealedLink);
    setStatus("copied");
    window.setTimeout(() => setStatus("ready"), 1400);
  }

  return (
    <section className="builder-shell" id="compose" aria-labelledby="compose-title">
      <div className="builder-heading">
        <div>
          <span className="eyebrow">ENCRYPTED TRANSMISSION</span>
          <h2 id="compose-title">Seal a destination.</h2>
        </div>
        <div className="signal-chip"><span /> CLIENT-SIDE ONLY</div>
      </div>

      <form className="cipher-form" onSubmit={createLink}>
        <label className="field field-wide">
          <span className="field-label"><b>01</b> Destination</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://example.com/briefing"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            autoComplete="url"
            required
          />
          <small>Only HTTP and HTTPS targets are accepted.</small>
        </label>

        <div className="field-grid">
          <label className="field">
            <span className="field-label"><b>02</b> Codename</span>
            <input
              type="text"
              maxLength={28}
              value={codename}
              onChange={(event) => setCodename(event.target.value.toUpperCase())}
              placeholder="NIGHTFALL"
            />
          </label>

          <label className="field">
            <span className="field-label"><b>03</b> Expiry</span>
            <select value={expiry} onChange={(event) => setExpiry(event.target.value)}>
              {expiryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field field-wide">
          <span className="field-label"><b>04</b> Access code <em>optional</em></span>
          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Leave blank to embed a random key in the fragment"
            autoComplete="new-password"
          />
          <small>{passcode ? "The code will not be included in the link." : "No code: a random key is carried inside the URL fragment."}</small>
        </label>

        <label className="field field-wide">
          <span className="field-label"><b>05</b> Briefing <em>optional</em></span>
          <textarea
            maxLength={240}
            rows={3}
            value={briefing}
            onChange={(event) => setBriefing(event.target.value)}
            placeholder="Visible only after the capsule is decrypted."
          />
          <small>{briefing.length}/240</small>
        </label>

        <label className="toggle-row">
          <span>
            <strong>Burn after reveal</strong>
            <small>Blocks reopening on the same browser after successful decryption.</small>
          </span>
          <input
            type="checkbox"
            checked={burnAfterReveal}
            onChange={(event) => setBurnAfterReveal(event.target.checked)}
          />
          <span className="toggle-visual" aria-hidden="true"><i /></span>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="seal-button" type="submit" disabled={status === "sealing"}>
          <span>{status === "sealing" ? "SEALING…" : "SEAL TRANSMISSION"}</span>
          <span className="button-arrow">↗</span>
        </button>
      </form>

      <div className={`sealed-output ${sealedLink ? "is-live" : ""}`} aria-live="polite">
        <div className="output-topline">
          <span>CAPSULE / {codename.trim() || "UNTITLED"}</span>
          <span className="classified">CLASSIFIED</span>
        </div>
        <div className="destination-line">
          <span className="reticle">⌖</span>
          <div>
            <small>TARGET</small>
            <strong>{destinationHost}</strong>
          </div>
        </div>
        {sealedLink ? (
          <>
            <div className="sealed-link" title={sealedLink}>{sealedLink}</div>
            <div className="output-actions">
              <button type="button" onClick={copyLink}>{status === "copied" ? "COPIED" : "COPY CIPHER LINK"}</button>
              <a href={sealedLink}>TEST OPEN ↗</a>
            </div>
          </>
        ) : (
          <p className="output-placeholder">A sealed link will materialize here. The destination stays out of server storage.</p>
        )}
      </div>
    </section>
  );
}
