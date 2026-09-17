/** @type {import('next').NextConfig} */

// Every page in this app styles with inline `style={{...}}` (not <style>
// tags), which CSP's nonce mechanism doesn't cover — the inline `style`
// attribute always needs 'unsafe-inline' regardless of nonces. A strict
// nonce-based CSP would also force every page into dynamic rendering. So
// this is the documented "without nonces" fallback (next.config `headers()`)
// rather than proxy-issued nonces: still a real allowlist (blocks loading
// scripts/frames/connections from any origin this app doesn't itself need),
// just not the strictest possible policy.
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  // Don't advertise the framework/version to every visitor.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
