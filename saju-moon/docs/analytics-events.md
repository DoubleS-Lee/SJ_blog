# Analytics Events

관리자 분석 대시보드에서 사용하는 1차 이벤트 정의입니다.

## 목적

- 어떤 메뉴와 콘텐츠에 관심이 많은지 파악
- 고객이 어디에 오래 머무는지 확인
- 체류시간과 전환율을 높이기 위한 운영 판단 자료 확보

## 수집 이벤트

### `session_start`
- 새 세션이 시작될 때 1회 기록
- 주요 속성:
  - `entry_path`

### `page_view`
- 페이지 진입 시 기록
- 주요 속성:
  - `page_type`
  - `page_path`
  - `content_type`
  - `content_id`

### `scroll_depth`
- 25 / 50 / 75 / 100% 구간을 처음 넘을 때 기록
- 주요 속성:
  - `depth_percent`

### `engagement_time`
- 페이지 이탈/숨김 시점에 기록
- 주요 속성:
  - `engagement_time_ms`
  - `max_scroll_depth`

### `menu_click`
- 상단 메뉴 클릭 시 기록
- 주요 속성:
  - `menu_name`
  - `target_path`

### `content_click`
- 블로그 리스트/대표 카드 클릭 시 기록
- 주요 속성:
  - `content_type`
  - `content_id`
  - `content_title`
  - `category`
  - `list_context`

## 비고

- `/admin` 경로는 고객 행동 데이터 왜곡을 막기 위해 추적 대상에서 제외합니다.
- 현재 1차 버전은 전환 이벤트(`cta_click`, `conversion`)를 위한 스키마만 열어두고, 실제 연결은 후속 작업으로 확장합니다.
