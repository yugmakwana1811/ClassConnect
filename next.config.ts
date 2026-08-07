import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/api/pdfs/*": [
      "./node_modules/@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf",
      "./node_modules/@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf",
    ],
    "/api/files/*": [
      "./node_modules/@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf",
      "./node_modules/@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf",
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    const productionHeaders =
      process.env.NODE_ENV === "production"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                "base-uri 'self'",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.vercel-storage.com",
                "upgrade-insecure-requests",
              ].join("; "),
            },
          ]
        : [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          ...productionHeaders,
        ],
      },
      {
        source: "/api/pdfs/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'self'; sandbox",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
