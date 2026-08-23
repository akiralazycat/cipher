# Cipher

**Links with clearance.**

Cipher turns a normal destination URL into a classified-looking, client-side encrypted capsule. It is a Next.js experiment in making link sharing feel deliberate without introducing a destination database, account system, or tracking layer.

## What it does

- AES-256-GCM encryption in the browser via Web Crypto
- Payload carried in the URL fragment (`/open#...`)
- Optional separate access code
- PBKDF2-SHA-256 key derivation for code-protected capsules
- Sender-defined expiry timer
- Optional local burn-after-reveal on the recipient browser
- Optional codename and encrypted briefing note
- No external database required
- No third-party UI or crypto dependencies
- Responsive receive terminal and link composer

## Why the fragment matters

The encrypted capsule lives after `#` in the generated URL. URL fragments are handled by the browser and are not included in the normal HTTP request sent to the Cipher origin. That means Cipher can serve the receiver UI without needing the encrypted destination payload as a server-side route parameter.

For capsules without an access code, Cipher generates a random AES key and carries that key inside the same fragment. This does **not** restrict a recipient who has the complete link; its purpose is to keep the destination out of Cipher's server storage/request path.

For capsules with an access code, the key is derived from that separate code with PBKDF2 and is not included in the link.

## Security boundary

Cipher is a presentation and link-privacy tool, not an authorization system, DRM product, anonymous network, or remote-revocation service.

Expiry and burn-after-reveal are enforced by the Cipher client. A recipient who possesses the capsule and any required access code can modify client software, change a device clock, copy data before navigation, or open a burn-enabled capsule in another browser. Protect sensitive resources with authentication and authorization at the destination itself.

The current app intentionally has no analytics and no destination persistence. Hosting infrastructure can still observe ordinary request metadata such as IP address and the `/open` request; the URL fragment itself is not part of that HTTP request.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

```bash
npm run typecheck
npm run build
```

## Deployment

Cipher is designed for a standard Vercel Next.js deployment and needs no runtime environment variables for the current zero-storage architecture.

Production home: `https://cipher.manabeakira.com`

## Stack

- Next.js 16
- React 19
- TypeScript
- Web Crypto API
- CSS, no component framework

## License

MIT
