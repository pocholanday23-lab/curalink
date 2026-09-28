import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // Contract PDF extraction depends on pdf-parse/pdfjs-dist's own
  // relative worker-script loading, which breaks under Turbopack's
  // server bundling. Leaving these external makes Next load them via
  // Node's native require/import at runtime instead of bundling them.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
