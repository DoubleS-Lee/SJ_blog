# 사주문(SajuMoon) 프로젝트 기획 검토 및 구현 계획

> 작성일: 2026-04-12 | 기반: 요구사항 정의서 v6 (최종)

---

## 1. 프로젝트 요약

**사주문(SajuMoon)** — 사주 인플루언서 허브 블로그
- 만세력 조회 + 블로그 글마다 "내 사주에 해당되는지" 자동 판정
- 유튜브/인스타 유입 → 회원 전환 → 유료 구독 퍼널
- 스택: Next.js(App Router) + Supabase + Tiptap + lunar-javascript + Tailwind + shadcn/ui + Vercel

---

## 2. 기획서 심층 검토 — 발견된 이슈

### 🔴 Critical (구현 전 반드시 결정 필요)

#### C-1. 카카오 OAuth 이메일 nullable 미처리
- 카카오 로그인 시 이메일 제공은 **사용자 선택 사항**
- users 테이블 `email` 컬럼이 NOT NULL이면 카카오 로그인 자체가 실패할 수 있음
- **수정**: `email` 컬럼을 nullable로 변경 + 이메일 없는 경우 UI 처리 추가

#### C-2. 판정 조건 그룹 전체 비활성 시 동작 미정 → ✅ 결정
- 활성 조건이 0개인 그룹은 판정에서 **skip** (통과 아님)
- 조건이 하나도 없는 글에는 판정 영역 자체를 미표시

#### C-3. 사주 미입력 회원 UX 흐름 미정 → ✅ 결정
- 로그인 후 사주 미입력 상태에서 글 열면 → 판정 영역에 "사주 정보 입력 필요" CTA 표시

#### C-4. 생시 모름 + 대운 판정 → ✅ 결정
- **대운 조건(⑯⑰)만 자동 skip** — 나머지 원국/세운 조건으로만 판정
- 판정 결과 하단에 "생시 입력 시 대운 조건도 반영됩니다" 안내 표시
- 세운 조건(⑭⑮)은 생시와 무관하므로 정상 적용

#### C-5. 생시 모름 + 60갑자 4주 전체 → ✅ 결정
- **시주 60갑자(null)는 skip, 연/월/일 3주만 비교**
- 3주 중 하나라도 일치하면 조건 충족

---

### 🟡 Important (구현 품질에 영향)

#### I-1. 슬러그 생성 전략 → ✅ 결정
- **nanoid 자동 생성** 방식 채택 (예: `/posts/xk3m9p`)
- 글 저장 시 nanoid(7자리) 자동 생성, UNIQUE 제약

#### I-2. 블로그 목록 판정 뱃지 성능 → ✅ 결정
- **페이지네이션** 방식 확정 (1페이지 10개)
- 클라이언트에서 현재 페이지 글 ID 배열을 배치 판정 API에 1회 호출
- `target_year: null` 글은 날마다 결과가 달라지므로 클라이언트 단에서 처리

#### I-3. `ilgan` 컬럼 중복
- `user_saju.ilgan`은 `day_cheongan`과 값이 동일 — 기획서 명시대로 유지
- 용도: 빠른 인덱스 조회용 (판정 시 일간 기준 십성 계산에 활용)

#### I-4. Tiptap 저장 포맷 → ✅ 결정
- `content`, `judgment_detail` 모두 **Tiptap JSON 형식으로 저장** 통일
- 렌더링 시 Tiptap `generateHTML()` 또는 클라이언트 렌더러 사용

#### I-5. 오행/십성 점수 단위 → ✅ 결정
- 생시 있음: 합계 100점 만점으로 저장
- 생시 모름: 합계 **85점 만점 그대로 저장** (정규화 없음)
- ⚠️ 관리자는 판정 조건 임계값 입력 시 생시 모름 회원의 최대값이 85점임을 고려해야 함

#### I-6. 예약 발행 메커니즘 → ✅ 결정
- Vercel Cron Job + Supabase RPC 조합 (5단계에서 구현)
- 매 시간 `published_at <= now() AND is_published = false` 글을 자동 발행

#### I-7. 동일 이메일 소셜 로그인 충돌 → ✅ 결정
- Supabase Auth 기본 account linking 적용 (같은 이메일이면 기존 계정에 provider 연결)

---

### 🟢 권장 추가사항

#### A-1. Supabase RLS 정책 명시
- `is_admin` 체크를 UI에서만 하면 보안 취약
- 모든 admin 전용 작업에 Supabase RLS 정책 적용
- `posts` INSERT/UPDATE/DELETE: `auth.uid() IN (SELECT id FROM users WHERE is_admin = true)`

#### A-2. posts 테이블 인덱스 전략
```sql
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_list ON posts(is_published, published_at DESC, category);
CREATE INDEX idx_posts_featured ON posts(is_featured) WHERE is_published = true;
```

#### A-3. 회원 탈퇴 시 연관 데이터 처리
- user_saju, user_saju_ohang, user_saju_sipsung → `ON DELETE CASCADE`

#### A-4. 한국어 폰트 및 브랜드 컬러
- 폰트: Noto Sans KR — next/font로 최적화
- 브랜드 컬러: 미정 → 딥 네이비 + 골드 포인트 추천 (분석가 톤)

#### A-5. 개인정보 처리방침 페이지
- 한국 개인정보 보호법(PIPA) 준수 필요
- 생년월일, 성별 수집 → 가입 시 동의 UI + 별도 처리방침 페이지

#### A-6. 사주 재입력/수정 정책 → ✅ 결정
- **회원이 마이페이지에서 직접 수정 가능**
- 수정 시 사주 전체 재계산 → user_saju / user_saju_ohang / user_saju_sipsung 전체 덮어쓰기

#### A-7. 판정 결과 캐싱 (선택적)
- `post_judgments(user_id, post_id, judged_at, result)` 테이블로 결과 캐시
- target_year 고정 글: 한 번 캐시 후 재사용 / target_year null 글: 일 단위 만료

---

## 3. 확정된 핵심 명세

### 3.1 오행/십성 점수 가중치

```
생시 있음 (합계 100점):
연간 5 + 연지 5 + 월간 10 + 월지 30 + 일간 20 + 일지 15 + 시간 10 + 시지 5 = 100

생시 모름 (합계 85점, 그대로 저장):
연간 5 + 연지 5 + 월간 10 + 월지 30 + 일간 20 + 일지 15 = 85
```

### 3.2 판정 로직 예외 처리

| 상황 | 처리 방법 |
|---|---|
| 사주 미입력 회원 | 판정 영역에 "사주 정보 입력 필요" CTA |
| 조건 그룹 전체 비활성 | 해당 그룹 skip (통과 아님) |
| 판정 조건 JSON 없는 글 | 판정 영역 미표시 |
| 생시 모름 + 시간/시지 조건 | 해당 조건 자동 skip |
| 생시 모름 + 대운 조건(⑯⑰) | 대운 조건만 skip + 결과 하단 안내 |
| 생시 모름 + 세운 조건(⑭⑮) | 정상 적용 (생시 무관) |
| 생시 모름 + 60갑자 4주 전체 | 시주 null → 연/월/일 3주만 비교 |

### 3.3 DB 스키마 보완사항

```sql
-- users: 카카오 이메일 미제공 대응
email TEXT, -- nullable

-- 연관 테이블 CASCADE 삭제
-- user_saju, user_saju_ohang, user_saju_sipsung → ON DELETE CASCADE

-- posts 인덱스
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_list ON posts(is_published, published_at DESC, category);
CREATE INDEX idx_posts_featured ON posts(is_featured) WHERE is_published = true;

-- payments: 구독 주기 컬럼 추가 (5단계)
ALTER TABLE payments ADD COLUMN subscription_period TEXT
  CHECK (subscription_period IN ('monthly', 'annual'));
```

---

## 4. 신살(神殺) 확장 아키텍처 원칙

향후 도화살, 역마살 등 특수 신살 판정 조건이 추가될 수 있음.

### 핵심 원칙: DB 스키마 변경 없는 런타임 계산 방식
- 신살 데이터는 **회원 DB에 저장하지 않음**
- 판정 시점에 회원의 원국 지지(jiji) 4글자를 불러와 **서버에서 실시간 계산 후 버림**
- `user_saju`, `user_saju_ohang` 등 기존 테이블 스키마 변경 불필요

### judgment_rules JSON 확장성 설계
- 현재 정의된 17가지 조건 외에 `special_shinsal` 같은 새 키가 추가되어도 **파싱 에러가 나지 않도록** 유연하게 설계
- 백엔드 판정 로직은 알 수 없는 키를 조용히 무시(skip)하는 방어적 파싱 적용

```json
// 신살 조건 추가 예시 (나중에)
{
  "groups": [{
    "conditions": {
      "day_cheongan": { "enabled": true, "values": ["갑"] },
      "special_shinsal": { "enabled": true, "values": ["도화살"] }
    }
  }]
}
```

### 신살 계산 함수 구조 (확장 대비)
- 신살마다 계산 방법이 달라 **Map 구조로 계산 함수를 등록**하는 방식 채택
- 새 신살 추가 시 함수 하나만 등록하면 기존 로직 수정 불필요

```typescript
// 예시 구조
const shinsalCalculators: Record<string, (saju: UserSaju) => boolean> = {
  "도화살": calcDoha,
  "역마살": calcYeokma,
  // 새 신살은 여기에 추가
};
```

---

## 6. 개발 단계

### 1단계: MVP (최우선)
- [ ] Next.js 프로젝트 세팅 (App Router) + Tailwind CSS + shadcn/ui
- [ ] Supabase 연동 (DB + Auth + RLS 정책)
- [ ] 카카오 + 구글 소셜 로그인 (email nullable 처리)
- [ ] lunar-javascript 연동 + 만세력 조회 페이지
  - 32분 진태양시 보정
  - 생시 모름 예외 처리 (보정 미적용, 시주 null)
  - 오행/십성 점수 저장 (생시 있음: 100점, 없음: 85점)
- [ ] 회원 사주 저장 (원국 + 오행 JSONB + 십성 JSONB + 60갑자 4주)
- [ ] 마이페이지 사주 수정 기능
- [ ] 기본 블로그 목록/상세 페이지 (contra.com/blog 스타일, 페이지네이션 10개)
- [ ] 한국어 폰트 (next/font Noto Sans KR)
- [ ] Vercel 배포

### 2단계: 관리자 + 에디터
- [ ] 관리자 페이지 (is_admin 보호 + Supabase RLS)
- [ ] Tiptap 에디터 (JSON 저장 통일)
- [ ] 글 CRUD (slug: nanoid 자동 생성)
- [ ] 썸네일 업로드 (Supabase Storage)
- [ ] 카테고리 필터
- [ ] 판정 상세 설명 에디터
- [ ] posts 테이블 인덱스 적용

### 3단계: 판정 시스템
- [ ] 판정 조건 그룹 UI (17가지 조건, 그룹 추가/삭제)
- [ ] 60갑자 범위 선택 UI (일주만/4주 전체)
- [ ] 원국 판정 로직 (①~⑬, 예외 처리 포함)
- [ ] 대운/세운 판정 로직 (⑭~⑰, 생시 모름 skip 포함)
- [ ] 배치 판정 API (목록 페이지용 — 글 ID 배열 → 결과 맵)
- [ ] 글 목록 해당/비해당 뱃지
- [ ] 글 상세 판정 결과 + 상세 설명
- [ ] target_year 연도 뱃지

### 4단계: 등급 분리 + 법률
- [ ] site_settings 등급 분리 스위치
- [ ] 등급별 UI 분기 (스위치 OFF: 전부 공개)
- [ ] 업그레이드 CTA UI
- [ ] 개인정보 처리방침 페이지 (PIPA)
- [ ] 회원가입 동의 UI
- [ ] 회원 탈퇴 + CASCADE 삭제

### 5단계: 결제 연동 (추후)
- [ ] 토스페이먼츠 연동
- [ ] subscription_period (monthly/annual) 컬럼 포함
- [ ] 구독 → 등급 자동 변경
- [ ] Vercel Cron 예약 발행

### 6단계: 확장 (추후)
- [ ] PWA
- [ ] 뉴스레터 구독 폼
- [ ] 관련 글 추천 알고리즘
- [ ] 사용자 대시보드

---

## 7. 검증 방법

1. **만세력 계산 정확도**: 알려진 생년월일시(양력/음력) 다수 케이스로 출력값 수동 검증
2. **32분 보정 경계값**: 자시 00:32 → 보정 후 00:00 유지 / 23:32 → 다음날 자시
3. **생시 모름 처리**: 시주 컬럼 전부 null, 오행/십성 계산에서 시주 가중치 제외 확인
4. **판정 로직 edge case**: 조건 그룹 AND/OR 조합 단위 테스트
5. **성능**: 글 10개 기준 배치 판정 API 응답 500ms 이하
6. **RLS 권한**: 비관리자 직접 API 호출 시 차단 확인

---

## 8. 원본 요구사항 정의서 전문 (v6 최종)

### 프로젝트 개요
- 사주문(SajuMoon) — 사주 기반 개인 맞춤형 콘텐츠 플랫폼
- 목적: 유튜브/인스타 유입 → 회원 전환 → 유료 구독 수익화
- 핵심 차별점: 블로그 글마다 회원 사주 기반 자동 판정

### 기술 스택
Next.js(App Router) / Supabase(PostgreSQL+Auth) / Tiptap / lunar-javascript / Tailwind CSS / shadcn/ui / Vercel / 토스페이먼츠(추후)

### 회원 등급
비회원 / free / plus / premium

초기: free 회원도 전체 열람 가능 → 관리자 스위치로 등급 분리 활성화

등급 분리 후:
- free: 글만 열람
- plus: 글 + 판정 결과
- premium: 글 + 판정 결과 + 상세 설명

### 만세력 저장 데이터
- A. 사주 8글자 (연간/연지/월간/월지/일간/일지/시간nullable/시지nullable)
- B. 일간 (인덱스 컬럼)
- C. 60갑자 4주 (시주 nullable)
- D. 오행 JSONB (positions + scores) + has_mok~has_su boolean
- E. 십성 JSONB (positions + scores) + has_bigyeon~has_pyeonin boolean
- F. full_saju_data JSON (대운/세운 등 핵심 결과 보존 — 신살은 런타임 계산이므로 미저장)

가중치: 연간5 / 연지5 / 월간10 / 월지30 / 일간20 / 일지15 / 시간10 / 시지5

### 판정 시스템 17가지 조건
①연간 ②연지 ③월간 ④월지 ⑤일간 ⑥일지 ⑦시간 ⑧시지 (천간/지지 체크박스)
⑨오행 유무 (3택 라디오) ⑩오행 점수 임계값
⑪십성 유무 (3택 라디오) ⑫십성 점수 임계값
⑬60갑자 (범위: 일주만/4주전체 + 60갑자 체크박스)
⑭세운 천간 십성 ⑮세운 지지 십성 ⑯대운 천간 십성 ⑰대운 지지 십성

조건 논리: 그룹 내 AND, 그룹 간 OR

대운/세운: target_year 있으면 해당 연도 기준, 없으면 현재 열람 날짜 기준 실시간 계산

### 블로그 카테고리
연애·궁합 / 커리어·이직 / 재물·투자 / 건강·체질 / 육아·자녀교육

### DB 테이블
users / user_saju / user_saju_ohang / user_saju_sipsung / posts / site_settings / payments(추후)

posts 주요 컬럼:
- slug (nanoid 7자리, UNIQUE)
- target_year (Integer, nullable)
- judgment_rules (JSON, 그룹 구조)
- content / judgment_detail (Tiptap JSON)
- is_featured / is_published / published_at

### SEO
Next.js Metadata API / Open Graph / sitemap.xml(next-sitemap) / robots.txt / JSON-LD Article 스키마

### 소셜 채널
유튜브 / 인스타그램(@saju_moonfairy) / 네이버 블로그(blog.naver.com/saju_moon)

### 운영 방침
- 주 타겟: 모바일 사용자 (유튜브/카카오톡 링크 유입)
- 하루 1개 콘텐츠 운영
- 판정 조건은 관리자(사주 전문가)가 직접 설정
- 디자인 톤: 전문 분석가 (점쟁이/무속 이미지 지양)
- 진태양시 보정: 생시 - 32분 (생시 모름이면 미적용)
