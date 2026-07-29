# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Model

EquipChain is a blockchain-connected utility management platform handling financial transactions on the Stellar Soroban network. Security is our highest priority.

### Key Security Principles

1. **Never Trust the Client**: All state-changing operations must be validated server-side. Client-side validation is for UX only.
2. **Least Privilege**: API routes enforce permission checks. Export functionality is rate-limited.
3. **Defense in Depth**: Multiple security layers protect the application, including CSP, CSRF tokens, input validation, and security headers.
4. **No Secrets in the Browser**: No private keys, API secrets, or sensitive credentials are ever exposed to client-side JavaScript.

## Security Features

### HTTP Security Headers

All responses include:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'` + Stellar origins | Prevents XSS, data injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer data |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser APIs |

### CSRF Protection

All state-changing API routes (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid CSRF token:

- Token sent via `x-csrf-token` header (for JS clients)

Token verification uses HMAC-SHA256 with constant-time comparison to prevent timing attacks.

### Input Validation

All user inputs are validated using Zod schemas before processing:

- **Stellar Addresses**: Validated against G...(56 chars) base32 format
- **Numeric Amounts**: Validated as positive numbers with range checks
- **Meter IDs**: Alphanumeric with hyphens/underscores, max 64 chars
- **Export Configurations**: Format, columns, date ranges all validated

### Input Sanitization

All user-provided strings are sanitized to prevent XSS:

- HTML special characters escaped
- Script/style tags removed
- Event handler attributes stripped
- `javascript:` and `data:` URLs blocked
- SQL injection patterns filtered

### Wallet Origin Validation

Wallet connections are verified to originate from trusted Stellar wallet extensions:

- Freighter (`freighter.app`)
- Albedo (`albedo.link`)
- Rabet (`rabet.io`)
- Lobstr (`lobstr.co`)
- xBull (`xbull.app`)

### Environment Variable Validation

- All `NEXT_PUBLIC_*` variables validated at build time
- Secret leak detection prevents exposing keys in public env vars
- Server-side variables validated at application startup

### Dependency Security

- `npm audit` runs in CI with `--audit-level=high`
- Regular dependency updates recommended
- Supply chain security via `package-lock.json` integrity checks

### Data Export Security

- Export API routes require authentication
- Rate limiting on export endpoints (configurable via `API_RATE_LIMIT`)
- Maximum record limit for exports (configurable via `EXPORT_MAX_RECORDS`)
- Export file names sanitized to prevent path traversal
- Streaming downloads for large datasets prevent memory exhaustion

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Please report security issues privately to the EquipChain team. We will respond within 48 hours with next steps.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Any potential mitigations you've identified

### Disclosure Policy

- We will acknowledge receipt within 48 hours
- We will confirm the vulnerability and determine impact within 1 week
- We will release a fix as soon as possible, typically within 2 weeks
- We will credit the reporter (unless anonymity is requested)

## Security Assumptions

### Trusted Boundaries

1. **Stellar Network**: The Stellar consensus protocol is trusted for transaction finality
2. **Soroban RPC**: The configured Soroban RPC endpoint is trusted
3. **Backend API**: The backend API at the configured URL is trusted
4. **Wallet Extensions**: Only verified wallet extensions from the Chrome Web Store / official sources are trusted

### Untrusted Boundaries

1. **All User Input**: Every input from users is considered untrusted and validated
2. **Browser Extensions**: Non-wallet browser extensions are untrusted
3. **Third-Party APIs**: Any external API not explicitly listed as trusted

## Development Guidelines

### Code Review Checklist

- [ ] Are all user inputs validated with Zod schemas?
- [ ] Are state-changing API routes protected with CSRF?
- [ ] Is user content sanitized before rendering?
- [ ] Are no secrets exposed in client-side code?
- [ ] Are export operations rate-limited?
- [ ] Are security headers present on all responses?

### Pre-Deployment Checklist

- [ ] `npm audit` shows zero high/critical vulnerabilities
- [ ] All `NEXT_PUBLIC_*` variables contain no secrets
- [ ] CSRF_SECRET is set (min 32 chars) in production
- [ ] All security headers verified: `curl -I https://app.equipchain.io`
- [ ] CSP tested: script injection blocked
- [ ] CSRF tested: API requests without token return 403

### Tools

- **OWASP ZAP**: For comprehensive vulnerability scanning
- **npm audit**: For dependency vulnerability checking
- **Mozilla Observatory**: For security header verification
- **CSP Evaluator**: For Content Security Policy analysis
