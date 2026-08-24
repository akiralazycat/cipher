import CipherBuilder from "@/components/cipher-builder";

const features = [
  ["01", "Fragment sealed", "The encrypted capsule lives after # in the URL, so the destination is not part of the normal HTTP request to Cipher."],
  ["02", "Separate clearance", "Add an access code and the decryption key is derived in the recipient browser instead of travelling with the link."],
  ["03", "No link database", "Cipher does not need a short-link table, account, analytics pipeline or destination log to route a capsule."],
];

export default function Home() {
  return (
    <>
      <main className="home-page">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href="#top"><span className="wordmark-mark">C</span> CIPHER</a>
        <nav aria-label="Primary navigation">
          <a href="#compose">COMPOSE</a>
          <a href="#protocol">PROTOCOL</a>
        </nav>
        <div className="live-indicator"><span /> LOCAL CRYPTO ONLINE</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">PRIVATE LINK TRANSMISSION / WEB CRYPTO</span>
          <h1>A link should not<br />look <em>ordinary.</em></h1>
          <p>
            Turn a destination into a classified capsule. Add clearance, a mission timer and a one-browser burn sequence — without giving Cipher a destination database.
          </p>
          <a className="hero-cta" href="#compose">CREATE TRANSMISSION <span>↓</span></a>
        </div>

        <div className="hero-console" aria-hidden="true">
          <div className="console-top"><span>INTERCEPT / 7F-A1</span><span className="console-dot" /></div>
          <div className="radar">
            <i className="radar-ring ring-one" />
            <i className="radar-ring ring-two" />
            <i className="radar-cross horizontal" />
            <i className="radar-cross vertical" />
            <i className="radar-sweep" />
            <b className="radar-target" />
          </div>
          <div className="console-readout">
            <span><small>CHANNEL</small> AES-256-GCM</span>
            <span><small>ROUTE</small> FRAGMENT</span>
            <span><small>STORE</small> NONE</span>
          </div>
        </div>
      </section>

      <CipherBuilder />

      <section className="protocol" id="protocol">
        <div className="section-kicker"><span>FIELD NOTES</span><b>03 PRINCIPLES</b></div>
        <div className="protocol-heading">
          <h2>Spy-film theatre.<br /><em>Real browser primitives.</em></h2>
          <p>Cipher is deliberately dramatic at the interface layer and deliberately boring at the cryptographic layer: standard Web Crypto, explicit limits, no proprietary protocol.</p>
        </div>
        <div className="feature-grid">
          {features.map(([index, title, copy]) => (
            <article key={index}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="security-note">
          <div className="security-mark">!</div>
          <p><strong>Operational note.</strong> Expiry and burn are recipient-side controls, not remote revocation or DRM. A determined recipient who possesses the capsule and required code can modify client software. Use Cipher for controlled presentation and link privacy, not as a substitute for authorization on the destination itself.</p>
        </div>
      </section>

      <footer className="site-footer">
        <a className="wordmark muted" href="#top"><span className="wordmark-mark">C</span> CIPHER</a>
        <p>Links with clearance.</p>
        <div><span>NO ACCOUNTS</span><span>NO DESTINATION DB</span><span>MIT LICENSED</span></div>
      </footer>
      </main>
    </>
  );
}
