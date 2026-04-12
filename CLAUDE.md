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
