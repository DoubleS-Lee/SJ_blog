# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 사주문(SajuMoon) — Claude 작업 지침

전체 기획 및 결정 사항은 `plan.md` 참조.

---

## 프로젝트 개요

사주 인플루언서 허브 블로그. 핵심 기능은 **블로그 글마다 로그인 회원의 사주를 기반으로 "해당됨/아님" 자동 판정**.

- 스택: Next.js(App Router) · Supabase(PostgreSQL + Auth) · Tiptap · lunar-javascript · Tailwind CSS · shadcn/ui · Vercel
- 배포: Vercel / DB·Auth: Supabase

---

## 아키텍처 원칙

### 만세력 계산
- lunar-javascript는 **서버에서만** 사용 (외부 API 호출 없음)
- 생시 입력 시 **32분을 빼고** lunar-javascript에 전달 (서울 진태양시 보정)
- 생시 모름이면 **32분 보정 절대 적용하지 않음** — 시주 관련 모든 데이터 null 처리

### 신살(神殺) 확장
- 도화살·역마살 등 신살 데이터는 **DB에 저장하지 않음**
- 판정 시점에 회원 지지 4글자로 **서버 실시간 계산 후 버림** (DB 스키마 변경 없음)
- 신살 계산 함수는 `Record<string, (saju: UserSaju) => boolean>` Map 구조로 등록
- `judgment_rules` JSON은 미지의 키를 **조용히 skip**하는 방어적 파싱 적용

### 보안
- 관리자 전용 작업(글 CRUD, 회원 등급 변경)은 **Supabase RLS**로 DB 레벨 보호
- `is_admin` 체크는 UI가 아닌 RLS에서 강제

---

## 핵심 결정 사항 (변경 금지)

### 오행/십성 점수 저장
- 생시 있음: 가중치 합계 **100점** 만점으로 저장
- 생시 모름: 가중치 합계 **85점** 그대로 저장 (정규화 없음)
- 가중치: 연간5·연지5·월간10·월지30·일간20·일지15·(시간10·시지5는 생시 있을 때만)

### 슬러그
- posts 테이블 slug는 **nanoid 7자리 자동 생성** (UNIQUE 제약)

### 블로그 목록
- **페이지네이션** 방식, 1페이지 10개 고정
- 판정 뱃지: 현재 페이지 글 ID 배열을 배치 판정 API에 **1회 호출**로 처리

### Tiptap 저장 포맷
- `content`, `judgment_detail` 모두 **Tiptap JSON** 으로 저장 (HTML 아님)
- 렌더링 시 `generateHTML()` 사용

---

## 판정 로직 예외 처리 규칙

| 상황 | 처리 |
|---|---|
| 사주 미입력 회원 | 판정 영역에 "사주 정보 입력 필요" CTA 표시 |
| 조건 그룹 전체 비활성 | 해당 그룹 skip — 통과로 처리하지 않음 |
| 판정 조건 JSON 없는 글 | 판정 영역 미표시 |
| 생시 모름 + 시간/시지 조건 | 해당 조건 자동 skip |
| 생시 모름 + 대운 조건(⑯⑰) | 대운 조건만 skip + 결과 하단 안내 표시 |
| 생시 모름 + 세운 조건(⑭⑮) | 정상 적용 (생시 무관) |
| 생시 모름 + 60갑자 4주 전체 | 시주 null → 연/월/일 3주만 비교 |

---

## DB 규칙

- `users.email` — **nullable** (카카오 이메일 미제공 케이스 대응)
- `user_saju`, `user_saju_ohang`, `user_saju_sipsung` — `ON DELETE CASCADE`
- `full_saju_data` JSON — 대운/세운 핵심 결과 보존. **신살은 런타임 계산이므로 미저장**
- `posts.target_year` — nullable. null이면 열람 시점 날짜 기준으로 세운/대운 계산

---

## 디자인 레퍼런스 (contra.com/blog)

### 전체 톤
- 배경: 순백 (`#ffffff`), 텍스트: 블랙
- 테두리·그림자 없는 완전 플랫 디자인
- 여백 매우 넉넉 (섹션 간 padding 여유롭게)
- 카드 썸네일은 다크/블랙 계열 이미지 (밝은 흰 카드 박스 아님)

### 헤더 / 네비게이션
- 로고 좌측, 메뉴 중앙, Sign up + Log in 우측
- 모바일: 로고 좌측, Sign up 버튼 우측, 햄버거 메뉴

### 블로그 목록 페이지
- 페이지 상단 중앙에 블로그 타이틀 ("사주문 블로그" 등) — 세리프 또는 정제된 산세리프
- 타이틀 우측에 Topics 드롭다운 + 검색창
- **피처드 카드**: 좌우 분할 — 이미지 40% 좌측, 텍스트(카테고리 태그·날짜·읽는시간·제목·요약) 60% 우측
  - 모바일: 이미지 상단, 텍스트 하단으로 전환
- **그리드 카드**: 데스크탑 **3열**, 모바일 1열
  - ※ plan.md에 2열로 기재되어 있으나 실제 레퍼런스는 3열 — 구현 시 3열 기준으로

### 블로그 상세 페이지
- 본문: 좌측 ~60% 너비
- 우측 사이드바: CTA 카드 + 관련 글 목록
- 모바일: 사이드바 본문 하단으로 이동
- 카테고리 태그: 소형 배지, 제목 위 또는 아래
- 저자 정보: 아바타 + 이름 + 날짜 + 읽는 시간 (한 줄)

### 사주문 전용 추가 UI 요소
- 글 목록 카드: 해당됨/해당 안됨 뱃지 (로그인 회원만 표시)
- target_year 있는 글: "2026년 기준" 연도 뱃지
- 글 상세: 판정 결과 블록 (본문 하단 또는 사이드바)

---

## 개발 커맨드 (Next.js 스캐폴딩 후)

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint
npm run type-check # tsc --noEmit (tsconfig 설정 후)
```

Supabase 로컬 개발:
```bash
npx supabase start   # 로컬 Supabase 인스턴스
npx supabase db push # 마이그레이션 적용
npx supabase gen types typescript --local > src/types/supabase.ts
```

---

## 예상 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/           # 로그인·회원가입 라우트 그룹
│   ├── (blog)/
│   │   ├── page.tsx      # 블로그 목록 (피처드 + 3열 그리드)
│   │   └── [slug]/       # 글 상세
│   ├── admin/            # 관리자 페이지 (RLS 보호)
│   ├── mypage/           # 사주 입력·수정
│   └── manseryeok/       # 만세력 조회
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── blog/             # 블로그 목록·카드·뱃지
│   ├── judgment/         # 판정 결과 블록·CTA
│   └── editor/           # Tiptap 에디터
├── lib/
│   ├── supabase/
│   │   ├── server.ts     # createServerClient
│   │   └── client.ts     # createBrowserClient
│   ├── saju/
│   │   ├── calculate.ts  # lunar-javascript 래퍼 (서버 전용)
│   │   ├── judgment.ts   # 판정 로직 (17조건)
│   │   └── shinsal.ts    # 신살 계산 Map (런타임만)
│   └── utils.ts
├── types/
│   ├── supabase.ts       # Supabase 자동 생성 타입
│   └── saju.ts           # 사주 도메인 타입
└── actions/              # Server Actions
```

---

## 코드 작성 규칙

- 한국어 사주 용어는 영문 변수명으로 매핑: 천간→cheongan, 지지→jiji, 일간→ilgan, 오행→ohang, 십성→sipsung, 60갑자→sixty_ganji
- lunar-javascript API 호출은 반드시 서버 컴포넌트 또는 Server Action / Route Handler 내에서만
- Supabase 클라이언트: 서버 컴포넌트용(`createServerClient`)과 클라이언트 컴포넌트용(`createBrowserClient`) 분리
- shadcn/ui 컴포넌트를 먼저 활용하고, 없을 때만 커스텀 제작

---

## 개발 단계 (현재 위치 업데이트 필요)

- [x] 기획 확정 및 plan.md 작성
- [ ] **1단계 MVP** ← 현재
- [ ] 2단계: 관리자 + 에디터
- [ ] 3단계: 판정 시스템
- [ ] 4단계: 등급 분리 + 법률
- [ ] 5단계: 결제 연동 (추후)
- [ ] 6단계: 확장 기능 (추후)
