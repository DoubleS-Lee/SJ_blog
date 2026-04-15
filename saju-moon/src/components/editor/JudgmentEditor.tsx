'use client'

import { useCallback, useState } from 'react'
import type { JudgmentRules, ConditionGroup, JudgmentCondition, PillarKey } from '@/types/judgment'
import type { Ohang, Sipsung, Cheongan, Jiji } from '@/types/saju'
import type { JSONContent } from '@tiptap/react'
import RichEditor from './RichEditor'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const CHEONGAN_LIST: Cheongan[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const JIJI_LIST: Jiji[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const OHANG_LIST: Ohang[] = ['목', '화', '토', '금', '수']
const SIPSUNG_LIST: Sipsung[] = [
  '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인',
]
const PILLAR_OPTIONS: { value: PillarKey; label: string }[] = [
  { value: 'year', label: '연주 (연간/연지)' },
  { value: 'month', label: '월주 (월간/월지)' },
  { value: 'day', label: '일주 (일간/일지)' },
  { value: 'hour', label: '시주 (시간/시지)' },
]
const SIXTY_GANJI = Array.from({ length: 60 }, (_, i) => `${CHEONGAN_LIST[i % 10]}${JIJI_LIST[i % 12]}`)

const CONDITION_TYPE_OPTIONS = [
  { value: 'pillar_cheongan', label: '원국 천간 (①③⑤⑦)' },
  { value: 'pillar_jiji',     label: '원국 지지 (②④⑥⑧)' },
  { value: 'ohang_presence',  label: '오행 유무 (⑨)' },
  { value: 'ohang_score',     label: '오행 점수 (⑩)' },
  { value: 'sipsung_presence',label: '십성 유무 (⑪)' },
  { value: 'sipsung_score',   label: '십성 점수 (⑫)' },
  { value: 'sixty_ganji',     label: '60갑자 (⑬)' },
  { value: 'sewoon_cheongan', label: '세운 천간 십성 (⑭)' },
  { value: 'sewoon_jiji',     label: '세운 지지 십성 (⑮)' },
  { value: 'daewoon_cheongan',label: '대운 천간 십성 (⑯)' },
  { value: 'daewoon_jiji',    label: '대운 지지 십성 (⑰)' },
]

function makeDefaultCondition(type: string): JudgmentCondition {
  switch (type) {
    case 'pillar_cheongan': return { type: 'pillar_cheongan', pillar: 'year', values: [], enabled: true }
    case 'pillar_jiji':     return { type: 'pillar_jiji', pillar: 'year', values: [], enabled: true }
    case 'ohang_presence':  return { type: 'ohang_presence', ohang: '목', mode: 'has', enabled: true }
    case 'ohang_score':     return { type: 'ohang_score', ohang: '목', operator: 'gte', threshold: 30, enabled: true }
    case 'sipsung_presence':return { type: 'sipsung_presence', sipsung: '비견', mode: 'has', enabled: true }
    case 'sipsung_score':   return { type: 'sipsung_score', sipsung: '비견', operator: 'gte', threshold: 20, enabled: true }
    case 'sixty_ganji':     return { type: 'sixty_ganji', scope: 'ilju', values: [], enabled: true }
    case 'sewoon_cheongan': return { type: 'sewoon_cheongan', values: [], enabled: true }
    case 'sewoon_jiji':     return { type: 'sewoon_jiji', values: [], enabled: true }
    case 'daewoon_cheongan':return { type: 'daewoon_cheongan', values: [], enabled: true }
    case 'daewoon_jiji':    return { type: 'daewoon_jiji', values: [], enabled: true }
    default:                return { type: 'pillar_cheongan', pillar: 'year', values: [], enabled: true }
  }
}

function makeGroupId() {
  return Math.random().toString(36).slice(2, 8)
}

// ─────────────────────────────────────────────
// 스타일 상수
// ─────────────────────────────────────────────

const selectCls = 'border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black'
const inputCls  = 'border border-gray-200 rounded px-2 py-1 text-sm bg-white w-24 focus:outline-none focus:ring-1 focus:ring-black'

// ─────────────────────────────────────────────
// 조건 유형별 에디터
// ─────────────────────────────────────────────

function CheckboxGroup<T extends string>({
  all, selected, onChange, columns = 5,
}: {
  all: readonly T[]
  selected: T[]
  onChange: (v: T[]) => void
  columns?: number
}) {
  function toggle(v: T) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  }
  return (
    <div className={`grid gap-1 mt-1`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {all.map((v) => (
        <label key={v} className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} className="accent-black" />
          <span className="text-xs">{v}</span>
        </label>
      ))}
    </div>
  )
}

function ConditionEditor({
  cond, onChange, onDelete,
}: {
  cond: JudgmentCondition
  onChange: (c: JudgmentCondition) => void
  onDelete: () => void
}) {
  function changeType(type: string) {
    onChange(makeDefaultCondition(type))
  }

  function renderFields() {
    switch (cond.type) {
      case 'pillar_cheongan':
        return (
          <div className="flex flex-col gap-2">
            <select value={cond.pillar} onChange={(e) => onChange({ ...cond, pillar: e.target.value as PillarKey })} className={selectCls}>
              {PILLAR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <CheckboxGroup all={CHEONGAN_LIST} selected={cond.values} onChange={(v) => onChange({ ...cond, values: v })} columns={5} />
          </div>
        )
      case 'pillar_jiji':
        return (
          <div className="flex flex-col gap-2">
            <select value={cond.pillar} onChange={(e) => onChange({ ...cond, pillar: e.target.value as PillarKey })} className={selectCls}>
              {PILLAR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <CheckboxGroup all={JIJI_LIST} selected={cond.values} onChange={(v) => onChange({ ...cond, values: v })} columns={6} />
          </div>
        )
      case 'ohang_presence':
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <select value={cond.ohang} onChange={(e) => onChange({ ...cond, ohang: e.target.value as Ohang })} className={selectCls}>
              {OHANG_LIST.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={cond.mode === 'has'} onChange={() => onChange({ ...cond, mode: 'has' })} className="accent-black" />있음
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={cond.mode === 'no'} onChange={() => onChange({ ...cond, mode: 'no' })} className="accent-black" />없음
            </label>
          </div>
        )
      case 'ohang_score':
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <select value={cond.ohang} onChange={(e) => onChange({ ...cond, ohang: e.target.value as Ohang })} className={selectCls}>
              {OHANG_LIST.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={cond.operator} onChange={(e) => onChange({ ...cond, operator: e.target.value as 'gte' | 'lte' })} className={selectCls}>
              <option value="gte">이상 (≥)</option>
              <option value="lte">이하 (≤)</option>
            </select>
            <input type="number" value={cond.threshold} min={0} max={100}
              onChange={(e) => onChange({ ...cond, threshold: parseInt(e.target.value) || 0 })}
              className={inputCls} />
            <span className="text-xs text-gray-500">점 (생시 모름: 85점 만점)</span>
          </div>
        )
      case 'sipsung_presence':
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <select value={cond.sipsung} onChange={(e) => onChange({ ...cond, sipsung: e.target.value as Sipsung })} className={selectCls}>
              {SIPSUNG_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={cond.mode === 'has'} onChange={() => onChange({ ...cond, mode: 'has' })} className="accent-black" />있음
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={cond.mode === 'no'} onChange={() => onChange({ ...cond, mode: 'no' })} className="accent-black" />없음
            </label>
          </div>
        )
      case 'sipsung_score':
        return (
          <div className="flex gap-2 items-center flex-wrap">
            <select value={cond.sipsung} onChange={(e) => onChange({ ...cond, sipsung: e.target.value as Sipsung })} className={selectCls}>
              {SIPSUNG_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={cond.operator} onChange={(e) => onChange({ ...cond, operator: e.target.value as 'gte' | 'lte' })} className={selectCls}>
              <option value="gte">이상 (≥)</option>
              <option value="lte">이하 (≤)</option>
            </select>
            <input type="number" value={cond.threshold} min={0} max={100}
              onChange={(e) => onChange({ ...cond, threshold: parseInt(e.target.value) || 0 })}
              className={inputCls} />
            <span className="text-xs text-gray-500">점</span>
          </div>
        )
      case 'sixty_ganji':
        return (
          <div className="flex flex-col gap-2">
            <select value={cond.scope} onChange={(e) => onChange({ ...cond, scope: e.target.value as 'ilju' | 'all' })} className={selectCls}>
              <option value="ilju">일주만</option>
              <option value="all">4주 전체</option>
            </select>
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded p-2">
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
                {SIXTY_GANJI.map((g) => (
                  <label key={g} className="flex items-center gap-0.5 cursor-pointer">
                    <input type="checkbox" checked={cond.values.includes(g)}
                      onChange={() => {
                        const next = cond.values.includes(g) ? cond.values.filter((x) => x !== g) : [...cond.values, g]
                        onChange({ ...cond, values: next })
                      }}
                      className="accent-black" />
                    <span className="text-[10px]">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      case 'sewoon_cheongan':
      case 'sewoon_jiji':
      case 'daewoon_cheongan':
      case 'daewoon_jiji':
        return (
          <CheckboxGroup
            all={SIPSUNG_LIST}
            selected={cond.values}
            onChange={(v) => onChange({ ...cond, values: v } as JudgmentCondition)}
            columns={5}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="border border-gray-100 rounded p-3 bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={cond.enabled} onChange={(e) => onChange({ ...cond, enabled: e.target.checked })} className="accent-black" />
            <span className="text-xs font-medium text-gray-600">활성</span>
          </label>
          <select
            value={cond.type}
            onChange={(e) => changeType(e.target.value)}
            className={selectCls}
          >
            {CONDITION_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 shrink-0">삭제</button>
      </div>
      {cond.enabled && <div className="pl-6">{renderFields()}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// 그룹 에디터
// ─────────────────────────────────────────────

function GroupEditor({
  index, group, onChange, onDelete,
}: {
  index: number
  group: ConditionGroup
  onChange: (g: ConditionGroup) => void
  onDelete: () => void
}) {
  const [showDetail, setShowDetail] = useState(!!group.detail)

  function addCondition() {
    onChange({ ...group, conditions: [...group.conditions, makeDefaultCondition('pillar_cheongan')] })
  }

  function updateCondition(i: number, c: JudgmentCondition) {
    const next = [...group.conditions]
    next[i] = c
    onChange({ ...group, conditions: next })
  }

  function deleteCondition(i: number) {
    onChange({ ...group, conditions: group.conditions.filter((_, ci) => ci !== i) })
  }

  function handleDetailChange(detail: JSONContent) {
    onChange({ ...group, detail })
  }

  function handleDetailToggle(checked: boolean) {
    setShowDetail(checked)
    if (!checked) onChange({ ...group, detail: null })
  }

  return (
    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">그룹 {index + 1}</span>
        <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">그룹 삭제</button>
      </div>

      <div className="flex flex-col gap-2">
        {group.conditions.map((cond, i) => (
          <ConditionEditor
            key={i}
            cond={cond}
            onChange={(c) => updateCondition(i, c)}
            onDelete={() => deleteCondition(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCondition}
        className="mt-3 text-xs text-gray-500 hover:text-black border border-dashed border-gray-300 rounded px-3 py-1.5 w-full transition-colors"
      >
        + 조건 추가 (AND)
      </button>

      {/* 그룹별 판정 상세 설명 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-1.5 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={showDetail}
            onChange={(e) => handleDetailToggle(e.target.checked)}
            className="accent-black"
          />
          <span className="text-xs font-medium text-gray-600">이 그룹 판정 상세 설명</span>
          <span className="text-xs text-gray-400">(해당됨/안됨 결과 아래에 표시)</span>
        </label>
        {showDetail && (
          <RichEditor
            initialContent={group.detail ?? undefined}
            onChange={handleDetailChange}
            placeholder="이 조건에 해당하는 독자에게 보여줄 상세 설명을 작성하세요..."
            minHeight="150px"
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

interface Props {
  value: JudgmentRules | null
  onChange: (rules: JudgmentRules | null) => void
}

export default function JudgmentEditor({ value, onChange }: Props) {
  const rules: JudgmentRules = value ?? { groups: [] }

  const addGroup = useCallback(() => {
    onChange({ groups: [...rules.groups, { id: makeGroupId(), conditions: [] }] })
  }, [rules, onChange])

  function removeGroup(id: string) {
    const next = rules.groups.filter((g) => g.id !== id)
    onChange(next.length > 0 ? { groups: next } : null)
  }

  function updateGroup(id: string, g: ConditionGroup) {
    onChange({ groups: rules.groups.map((gr) => gr.id === id ? g : gr) })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400">
        그룹 내 조건: <strong>AND</strong> (모두 충족) &nbsp;|&nbsp; 그룹 간: <strong>OR</strong> (하나라도 충족)
      </p>

      {rules.groups.map((g, i) => (
        <GroupEditor
          key={g.id}
          index={i}
          group={g}
          onChange={(updated) => updateGroup(g.id, updated)}
          onDelete={() => removeGroup(g.id)}
        />
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="text-sm border border-dashed border-gray-300 rounded-md px-4 py-2 text-gray-500 hover:text-black hover:border-gray-500 transition-colors"
      >
        + 그룹 추가 (OR)
      </button>
    </div>
  )
}
