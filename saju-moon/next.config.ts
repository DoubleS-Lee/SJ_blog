import type { NextConfig } from "next";

// 배포 중 잠깐 뜬 404/에러 화면이 사용자 브라우저 디스크 캐시에 눌러앉으면
// 하드 리로드(Ctrl+Shift+R) 전까지 계속 404가 보인다. Vercel이 프리렌더된 /404·/500을
// 정적 자산으로 내보낼 때 붙는 `public, max-age=0, must-revalidate`를 덮어쓴다.
const NO_STORE = 'no-store, must-revalidate'

const nextConfig: NextConfig = {
  // Per-response CSP nonces cannot be reused in a prerendered HTML shell.
  // Public database reads remain cached with unstable_cache and the posts tag.
  cacheComponents: false,
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
        // 라우트에 매칭되지 않는 주소가 프리렌더된 /404 정적 자산으로 서빙되는 경로.
        // notFound()가 /posts/[slug] 같은 실제 경로에서 던져지는 경우는 요청 경로가
        // /404가 아니라 여기 매칭되지 않는다 — 그쪽은 app/not-found.tsx 렌더가
        // 동적 홀을 가진 PPR 응답이라 Next가 `private, no-cache, no-store, ...`를 직접 붙인다.
        source: '/404',
        headers: [{ key: 'Cache-Control', value: NO_STORE }],
      },
      {
        source: '/500',
        headers: [{ key: 'Cache-Control', value: NO_STORE }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      ...[
        '/reviews', '/admin/:path*', '/mypage/:path*', '/login', '/agree',
        '/auth/:path*', '/counsel/:path+', '/compatibility/:path*',
        '/taekil', '/interpretation', '/manseryeok', '/life-graph',
      ].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ]
  },
};

export default nextConfig;
