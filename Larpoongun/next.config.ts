import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev server only serves its scripts to `localhost` by default. Without these, opening the
  // site via 127.0.0.1 or a LAN address loads the HTML but no JavaScript (no scroll effects, no cart).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
