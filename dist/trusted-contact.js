/* Session-only TOTP primitives and public educational content. No storage or network access. */
(function (root) {
  'use strict';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const references = [
    { label: '2FAS Auth setup', url: 'https://2fas.com/support/2fas-auth-mobile-app/2fas-auth-app-tutorial/' },
    { label: 'VIP Access QR wallet', url: 'https://vip.symantec.com/' },
    { label: 'FTC family emergency scams', url: 'https://consumer.ftc.gov/articles/scammers-use-fake-emergencies-steal-your-money' },
    { label: 'RFC 6238 TOTP standard', url: 'https://www.rfc-editor.org/rfc/rfc6238' }
  ];
  const steps = [
    { label: 'Generate a private QR code', detail: 'Open Communications > Trusted Contact Authentication in Ready Together. Give the contact or group a nickname, then generate a new shared key. Prefer a different key for each contact. Use a trusted device with both phones nearby.' },
    { label: 'Enroll your phone', detail: 'In 2FAS Auth, tap + and scan the QR. In VIP Access, use + / QR-App Code if supported by your version; use the added wallet entry, not the built-in VIP Credential ID. If scanning fails, try 2FAS or manual entry: time-based (TOTP), SHA-1, 6 digits, 30 seconds. On the same phone, reveal the setup key and enter it manually in the authenticator. Avoid screenshots and cloud photo backups.' },
    { label: 'Enroll your trusted contact', detail: 'Have the trusted contact securely scan the SAME QR, preferably in person. Do not generate a second key between scans. Anyone who scans it can generate future codes. Never post, email or text it publicly, or share it with an unverified caller.' },
    { label: 'Check that the codes match', detail: 'Compare both apps and the browser: all six digits should match and change together every 30 seconds. If near a change, wait for the next code. Set accurate automatic date/time before going offline, then test in airplane mode. The browser forgets keys when reloaded or closed; keep the enrolled entry in your authenticator.' },
    { label: 'Use it on a suspicious call', detail: 'Ask the caller for the current code from your shared entry. Silently compare against yours; do not read your code first. A mismatch means stop and verify another way. Even after a match, hang up and call a previously trusted number before sending money, sharing sensitive information or acting on an alleged emergency. Do not call a new number supplied by the caller.' }
  ];
  const safeguards = [
    { label: 'What a match means', detail: 'Matching codes confirm possession of a shared secret, not necessarily a person’s identity. Any group member can produce the same code. This is an extra family check, not phishing-resistant authentication or a login to Ready Together.' },
    { label: 'Replay and live relay', detail: 'A code overheard on a call, text or radio can be replayed briefly. An attacker can also relay a live code obtained from a real contact. There is no server enforcing single use, rate limits or revocation. Never treat a match alone as permission for money transfers or urgent instructions.' },
    { label: 'Private enrollment and device safety', detail: 'Keep the QR and setup key private. Use a locked, updated device and your authenticator’s app lock. This page keeps secrets only in memory and excludes them from planner backups and PDFs. It cannot protect against a compromised browser, malicious extensions, screen capture or someone using an unlocked phone. Review your authenticator’s own backup/sync settings.' },
    { label: 'Lost phone or exposed key', detail: 'Stop trusting the old entry. Meet or verify each other through a previously trusted route, generate a fresh key, re-enroll everyone and remove the old entry from each app. Clearing the browser does not revoke copies held elsewhere. There is no account recovery or server-side revocation.' },
    { label: 'Offline and radio use', detail: 'Codes need an accurate clock, not internet. Load Ready Together online until its offline-ready message appears, then test airplane mode before relying on it. Browsers may evict offline files. The browser’s keys do not survive reload; use the enrolled authenticator for ongoing offline verification. On radio, listeners may hear and replay codes. Follow radio rules; this adds neither encryption nor a radio link. If callback is unavailable, use your prearranged fallback and defer sensitive action. For immediate danger, use local emergency services; do not delay lifesaving care for a code.' }
  ];
  function cryptoAPI() {
    if (!root.crypto?.getRandomValues || !root.crypto?.subtle) throw new Error('Secure cryptography is unavailable. Open Ready Together over HTTPS in a current browser.');
    return root.crypto;
  }
  function encode(bytes) {
    let bits = 0, value = 0, out = '';
    for (const byte of bytes) {
      value = (value << 8) | byte; bits += 8;
      while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits) out += alphabet[(value << (5 - bits)) & 31];
    return out;
  }
  function decode(input) {
    const key = String(input).replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z2-7]{26,103}$/.test(key)) throw new Error('Enter a Base32 setup key containing 26–103 letters A–Z or digits 2–7. Do not enter a six-digit code.');
    let bits = 0, value = 0; const out = [];
    for (const char of key) {
      value = (value << 5) | alphabet.indexOf(char); bits += 5;
      if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
    }
    const bytes = new Uint8Array(out);
    if (encode(bytes) !== key) throw new Error('The setup key is incomplete or has invalid trailing characters.');
    return bytes;
  }
  function generate() { return encode(cryptoAPI().getRandomValues(new Uint8Array(20))); }
  function label(value) { return Array.from(String(value || '').trim().replace(/[\u0000-\u001f\u007f:]/g, ' ')).slice(0,40).join('').trim() || 'Trusted contact'; }
  function uri(secret, name) {
    const normalized = encode(decode(secret));
    return 'otpauth://totp/' + encodeURIComponent('Ready Together:' + label(name)) + '?secret=' + normalized + '&issuer=Ready%20Together&algorithm=SHA1&digits=6&period=30';
  }
  async function key(secret) { return cryptoAPI().subtle.importKey('raw', decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']); }
  async function code(signingKey, timestamp = Date.now(), digits = 6) {
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || ![6,8].includes(digits)) throw new Error('Invalid TOTP time or format.');
    let counter = BigInt(Math.floor(timestamp / 30000)); const buffer = new Uint8Array(8);
    for (let i=7;i>=0;i--) { buffer[i] = Number(counter & 255n); counter >>= 8n; }
    const hash = new Uint8Array(await cryptoAPI().subtle.sign('HMAC', signingKey, buffer));
    const offset = hash[hash.length-1] & 15;
    const n = ((hash[offset] & 127) << 24) | (hash[offset+1] << 16) | (hash[offset+2] << 8) | hash[offset+3];
    return String(n % 10**digits).padStart(digits,'0');
  }
  const remaining = (timestamp = Date.now()) => 30 - Math.floor((timestamp % 30000) / 1000);
  function worksheet() {
    return { banner: 'TRUSTED CONTACTS', title: 'Check a suspicious caller',
      lead: 'Use a shared rotating code as one extra check for phone spoofing, AI voice impersonation and off-grid check-ins. Set up in Ready Together’s Communications section. No QR, secret or live code is included in this report.',
      tableTitle: 'What you need', rows: [
        { item: 'Two trusted phones + authenticator apps', target: 'One per contact', detail: '2FAS Auth or a compatible TOTP app; VIP Access QR/App Code support can vary. No dedicated hardware or subscription is required by this tool.' },
        { item: 'Independent callback and fallback plan', target: 'Agree in advance', detail: 'Keep previously trusted phone numbers and a missed-check-in plan. A group code cannot distinguish individual members.' }
      ], tips: [...steps, ...safeguards], references };
  }
  const api = { encode, decode, generate, label, uri, key, code, remaining, steps, safeguards, references, worksheet };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ReadyTrusted = api;
})(globalThis);
