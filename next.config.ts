import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@tesseract.js-data/eng", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/*": ["./certs/supabase-ca.crt"],
    "/api/**": ["./certs/supabase-ca.crt", "./node_modules/pdf-parse/**/*", "./node_modules/pdfjs-dist/**/*", "./node_modules/@napi-rs/canvas/**/*", "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*", "./node_modules/tesseract.js/**/*", "./node_modules/tesseract.js-core/**/*", "./node_modules/@tesseract.js-data/eng/**/*", "./node_modules/wasm-feature-detect/**/*", "./node_modules/bmp-js/**/*", "./node_modules/regenerator-runtime/**/*"],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
