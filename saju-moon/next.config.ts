import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://t1.kakaocdn.net`,
  `connect-src 'self' https://*.supabase.co https://t1.kakaocdn.net${isDev ? " ws: wss:" : ''}`,
  "frame-src 'self' https://*.kakao.com https://*.kakaocdn.net",
].join('; ')

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ['192.168.219.110'],
  images: {
    // 썸네일은 PostCard/FeaturedCard에서 max-w-6xl(1152px) 컨테이너 안 33~42% 폭으로만
    // 렌더링됨 — 기본 deviceSizes(최대 3840px)를 그대로 두면 절대 안 쓰일 4K 변형까지
    // Image Optimization Transformation 후보에 매번 포함돼 무료 한도를 낭비하게 된다.
    deviceSizes: [400, 500, 800, 1000],
    imageSizes: [96, 192, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default nextConfig;
