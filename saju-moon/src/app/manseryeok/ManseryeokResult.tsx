'use client'

import { useState } from 'react'
import type { ManseryeokData, PillarDisplay, DaYunCard, SeWunCard, MoonCard } from '@/lib/saju/manseryeok'
import { OHANG_CN, KR_TO_CN_CHEONGAN } from '@/lib/saju/manseryeok'

// ─────────────────────────────────────────────
// 오행 컬러
// ─────────────────────────────────────────────
const OHANG_BG_SVG: Record<string, string> = {
  목: '#3b82f6', 화: '#ef4444', 토: '#f59e0b', 금: '#d1d5db', 수: '#1f2937',
}
const OHANG_TEXT_SVG: Record<string, string> = {
  목: '#fff', 화: '#fff', 토: '#fff', 금: '#374151', 수: '#fff',
}

const OHANG_BG: Record<string, string> = {
  목: 'bg-blue-500 text-white',
  화: 'bg-red-500 text-white',
  토: 'bg-amber-400 text-white',
  금: 'bg-gray-200 text-gray-700',
  수: 'bg-gray-800 text-white',
  '': 'bg-gray-100 text-gray-400',
}

// ─────────────────────────────────────────────
// 오행-십성 동적 매핑 (일간 오행 기준)
// ─────────────────────────────────────────────
const GENERATES: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
const CONTROLS: Record<string, string>  = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' }

function getOhangRole(ilgan: string, target: string): string {
  if (!ilgan || !target) return ''
  if (target === ilgan) return '비겁'
  if (GENERATES[ilgan] === target) return '식상'
  if (GENERATES[target] === ilgan) return '인성'
  if (CONTROLS[ilgan] === target) return '재성'
  if (CONTROLS[target] === ilgan) return '관성'
  return ''
}

// ─────────────────────────────────────────────
// 음양 매핑
// ─────────────────────────────────────────────
const CHEONGAN_YANG = new Set(['갑', '병', '무', '경', '임'])
const JIJI_YANG     = new Set(['자', '인', '진', '오', '신', '술'])

function isYang(kr: string): boolean {
  return CHEONGAN_YANG.has(kr) || JIJI_YANG.has(kr)
}

// ─────────────────────────────────────────────
// 천간/지지 뱃지
// ─────────────────────────────────────────────
function yangCheck(kr: string, isJiji: boolean): boolean {
  if (isJiji) return JIJI_YANG.has(kr)
  return CHEONGAN_YANG.has(kr)
}

function yangStyle(yang: boolean): React.CSSProperties {
  return {
    color: yang ? '#000000' : '#ffffff',
    textShadow: yang
      ? '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
      : '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
  }
}

function GanjiBadge({ cn, kr, ohang, isJiji = false, small = false }: {
  cn: string; kr: string; ohang: string; isJiji?: boolean; small?: boolean
}) {
  const size = small ? 'w-9 h-9 text-xl' : 'w-11 h-11 text-2xl'
  if (!cn) return <div className={`${size} rounded-lg bg-gray-100`} />
  const yang = yangCheck(kr, isJiji)
  const bgCls = OHANG_BG[ohang]?.split(' ')[0] ?? 'bg-gray-100'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`${size} rounded-lg flex items-center justify-center font-bold ${bgCls}`}
        style={yangStyle(yang)}>
        {cn}
      </div>
      {kr && (
        <span className="text-[9px] text-gray-400 leading-none whitespace-nowrap">
          {kr}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 도움말 툴팁
// ─────────────────────────────────────────────
function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return (
    <span className="relative inline-block align-middle">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[11px] text-gray-400 hover:text-gray-700 w-4 h-4 rounded-full border border-gray-300 hover:border-gray-500 inline-flex items-center justify-center transition-colors leading-none"
        aria-label="설명 보기"
      >
        ?
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-5 z-20 w-64 rounded-xl border border-gray-200 bg-white p-3 text-[11px] leading-4 text-gray-600 shadow-lg">
            <div className="space-y-1">
              {lines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────
// 대운/세운/월운 공통 카드 컬럼
// ─────────────────────────────────────────────
function RunCard({ label, card, showDiShi = true }: {
  label: string
  card: { cheonganCN: string; cheonganKR: string; cheonganOhang: string; jijiCN: string; jijiKR: string; jijiOhang: string; sipsung_gan: string; sipsung_jiji: string; diShi: string; isCurrent: boolean }
  showDiShi?: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl min-w-[52px] ${
      card.isCurrent ? 'border-2 border-dashed border-gray-400 bg-gray-50' : ''
    }`}>
      <span className="text-xs font-semibold text-gray-700 leading-none">{label}</span>
      <span className="text-[10px] text-gray-400 leading-none">{card.sipsung_gan || '—'}</span>
      <GanjiBadge cn={card.cheonganCN} kr={card.cheonganKR} ohang={card.cheonganOhang} small />
      <GanjiBadge cn={card.jijiCN} kr={card.jijiKR} ohang={card.jijiOhang} isJiji small />
      <span className="text-[10px] text-gray-400 leading-none">{card.sipsung_jiji || '—'}</span>
      {showDiShi && <span className="text-[10px] text-gray-500 leading-none">{card.diShi}</span>}
    </div>
  )
}

function PillarGridRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="text-[10px] text-gray-400 text-right pr-1.5 flex items-center justify-end leading-none">
        {label}
      </div>
      {children}
    </>
  )
}

// ─────────────────────────────────────────────
// 사주원국 탭 — 5열 그리드 (행 레이블 + 4주)
// ─────────────────────────────────────────────
function TabSajuWonguk({ data }: { data: ManseryeokData }) {
  const [year, month, day, hour] = data.pillars
  const cols: PillarDisplay[] = [hour, day, month, year] // 시→년 순

  return (
    <div>
      <h2 className="text-base font-bold mb-4">
        사주원국 <HelpTooltip text={'태어난 연·월·일·시를 8글자로 나타낸 표입니다.\n천간은 겉으로 드러난 기운입니다.\n지지는 그 기운이 머무는 자리입니다.\n지장간은 지지 안에 숨은 기운입니다.\n12운성은 일간 기준 기운의 성장 단계를 뜻합니다.'} />
      </h2>

      {/* 5열 그리드: [레이블] [시주] [일주] [월주] [년주] */}
      <div
        className="grid gap-y-2"
        style={{ gridTemplateColumns: '3.2rem repeat(4, 1fr)', alignItems: 'center' }}
      >
        {/* ── 헤더 ── */}
        <div />
        {cols.map((p) => (
          <div key={p.label} className="text-center">
            <p className="text-xs font-semibold text-gray-700">{p.label}</p>
          </div>
        ))}

        {/* ── 십성 (상단 천간) ── */}
        <PillarGridRow label="십성">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-xs text-gray-500 leading-none">
              {p.cheonganCN ? (p.sipsung_top ?? '일원') : ''}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 천간 음양 ── */}
        <PillarGridRow label="">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-xs leading-none">
              {p.cheonganCN
                ? <span className={isYang(p.cheonganKR) ? 'text-gray-700 font-bold' : 'text-gray-400'}>
                    {isYang(p.cheonganKR) ? '+' : '−'}
                  </span>
                : ''}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 천간 뱃지 ── */}
        <PillarGridRow label="천간">
          {cols.map((p) => (
            <div key={p.label} className="flex justify-center">
              {p.cheonganCN
                ? <GanjiBadge cn={p.cheonganCN} kr={p.cheonganKR} ohang={p.cheonganOhang} />
                : <div className="w-11 h-11" />}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 지지 뱃지 ── */}
        <PillarGridRow label="지지">
          {cols.map((p) => (
            <div key={p.label} className="flex justify-center">
              {p.jijiCN
                ? <GanjiBadge cn={p.jijiCN} kr={p.jijiKR} ohang={p.jijiOhang} />
                : <div className="w-11 h-11" />}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 지지 음양 ── */}
        <PillarGridRow label="">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-xs leading-none">
              {p.jijiCN
                ? <span className={isYang(p.jijiKR) ? 'text-gray-700 font-bold' : 'text-gray-400'}>
                    {isYang(p.jijiKR) ? '+' : '−'}
                  </span>
                : ''}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 십성 (하단 지장간) ── */}
        <PillarGridRow label="십성">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-xs text-gray-500 leading-none">
              {p.cheonganCN ? (p.sipsung_bot ?? '-') : ''}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 지장간 ── */}
        <PillarGridRow label="지장간">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-[10px] text-gray-500 leading-none">
              {p.hideGanKR.join('')}
            </div>
          ))}
        </PillarGridRow>

        {/* ── 12운성 ── */}
        <PillarGridRow label="12운성">
          {cols.map((p) => (
            <div key={p.label} className="text-center text-xs text-gray-600 leading-none">
              {p.cheonganCN ? (p.diShi || '-') : ''}
            </div>
          ))}
        </PillarGridRow>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 오행 오각형 + 생/극 화살표 SVG
// ─────────────────────────────────────────────
const ELEMS: ('목'|'화'|'토'|'금'|'수')[] = ['목', '화', '토', '금', '수']

// 생 쌍 (연속 인접): 목→화→토→금→수→목
const SHENG_PAIRS = [[0,1],[1,2],[2,3],[3,4],[4,0]] as const
// 극 쌍 (한 칸 건너): 목→토, 화→금, 토→수, 금→목, 수→화
const KEUK_PAIRS  = [[0,2],[1,3],[2,4],[3,0],[4,1]] as const

function penVertex(i: number, r: number, cx: number, cy: number) {
  const a = -Math.PI / 2 + i * (2 * Math.PI / 5)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function shortenLine(
  from: {x:number;y:number}, to: {x:number;y:number}, offset: number
) {
  const dx = to.x - from.x, dy = to.y - from.y
  const d = Math.sqrt(dx*dx + dy*dy)
  if (d < 0.001) return { sx: from.x, sy: from.y, ex: to.x, ey: to.y }
  const ux = dx/d, uy = dy/d
  return {
    sx: from.x + ux * offset, sy: from.y + uy * offset,
    ex: to.x   - ux * offset, ey: to.y   - uy * offset,
  }
}

function OhangPentagon({ scores, total, ilganOhang }: {
  scores: Record<string, number>
  total: number
  ilganOhang: string
}) {
  const W = 220, H = 220, cx = 110, cy = 108
  const R = 68     // 뱃지 중심 반지름
  const BDG = 13   // 뱃지 원 반지름

  const pts = ELEMS.map((_, i) => penVertex(i, R, cx, cy))
  const dataRatios = ELEMS.map(el => total > 0 ? (scores[el] ?? 0) / total : 0)
  const dataPts = ELEMS.map((_, i) => penVertex(i, R * dataRatios[i], cx, cy))

  const outerPath = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  const dataPath  = dataPts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 범례 */}
      <div className="flex gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <svg width="18" height="8"><line x1="1" y1="4" x2="14" y2="4" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr-s-legend)"/><defs><marker id="arr-s-legend" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="#22c55e"/></marker></defs></svg>
          생
        </span>
        <span className="flex items-center gap-1">
          <svg width="18" height="8"><line x1="1" y1="4" x2="14" y2="4" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2 1.5" markerEnd="url(#arr-k-legend)"/><defs><marker id="arr-k-legend" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="#9ca3af"/></marker></defs></svg>
          극
        </span>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <marker id="arr-s" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L6 3 L0 6z" fill="#22c55e"/>
          </marker>
          <marker id="arr-k" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L6 3 L0 6z" fill="#9ca3af"/>
          </marker>
        </defs>

        {/* 외곽 오각형 */}
        <path d={outerPath} fill="none" stroke="#e5e7eb" strokeWidth="1"/>

        {/* 생 화살표 (녹색 실선) */}
        {SHENG_PAIRS.map(([f, t]) => {
          const { sx, sy, ex, ey } = shortenLine(pts[f], pts[t], BDG + 3)
          return <line key={`s${f}${t}`} x1={sx} y1={sy} x2={ex} y2={ey}
            stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr-s)"/>
        })}

        {/* 극 화살표 (회색 점선) */}
        {KEUK_PAIRS.map(([f, t]) => {
          const { sx, sy, ex, ey } = shortenLine(pts[f], pts[t], BDG + 3)
          return <line key={`k${f}${t}`} x1={sx} y1={sy} x2={ex} y2={ey}
            stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#arr-k)"/>
        })}

        {/* 데이터 다각형 */}
        <path d={dataPath} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5"/>

        {/* 꼭짓점 뱃지 */}
        {ELEMS.map((el, i) => {
          const p = pts[i]
          const pct = total > 0 ? Math.round((scores[el]??0)/total*1000)/10 : 0
          const role = getOhangRole(ilganOhang, el)
          // 레이블 오프셋 (뱃지 밖으로)
          const lp = penVertex(i, R + BDG + 14, cx, cy)
          return (
            <g key={el}>
              <circle cx={p.x} cy={p.y} r={BDG} fill={OHANG_BG_SVG[el]} />
              <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="bold" fill={OHANG_TEXT_SVG[el]}>
                {OHANG_CN[el]}
              </text>
              <text x={lp.x} y={lp.y - 5} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="#6b7280">
                {pct}%
              </text>
              {role && (
                <text x={lp.x} y={lp.y + 6} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8" fill="#9ca3af">
                  {role}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────
// 오행과 심성 탭
// ─────────────────────────────────────────────
function TabOhang({ data }: { data: ManseryeokData }) {
  const ilgan = data.ilganOhang

  // 일간 기준 동적 그룹 계산
  const ohangGroups = (['목','화','토','금','수'] as const).map(oh => {
    const role = getOhangRole(ilgan, oh)
    const SIPSUNGS: Record<string, [string,string]> = {
      비겁: ['비견','겁재'], 식상: ['식신','상관'],
      재성: ['편재','정재'], 관성: ['편관','정관'], 인성: ['편인','정인'],
    }
    const sipsungs = SIPSUNGS[role] ?? ['','']
    return { oh, role, sipsungs }
  })

  return (
    <div>
      <h2 className="text-base font-bold mb-3">
        오행과 십성 <HelpTooltip text={'오행은 목·화·토·금·수 다섯 기운의 분포입니다.\n점수가 높을수록 그 오행이 강하게 작용합니다.\n십성은 일간과 다른 기운의 관계를 나눈 해석표입니다.\n오각형이 넓게 나온 오행일수록 발달한 편입니다.'} />
      </h2>

      <OhangPentagon scores={data.ohangScores} total={data.totalScore} ilganOhang={data.ilganOhang} />

      <div className="mt-4 flex flex-col gap-2">
        {ohangGroups.map(({ oh, role, sipsungs }) => {
          const score = data.ohangScores[oh] ?? 0
          const pct = data.totalScore > 0 ? Math.round(score / data.totalScore * 1000) / 10 : 0
          const isStrong = pct >= 25
          const cls = OHANG_BG[oh] ?? 'bg-gray-100 text-gray-500'
          return (
            <div key={oh} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${cls}`}>
                {OHANG_CN[oh]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{oh}({role})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isStrong ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    {isStrong ? '발달' : '부족'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {role === '비겁' && (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs text-gray-400">일간</span>
                    <span className="text-xs font-medium w-9 text-right">
                      {data.totalScore > 0 ? Math.round(20 / data.totalScore * 1000) / 10 : 0}%
                    </span>
                  </div>
                )}
                {sipsungs.filter(Boolean).map(ss => {
                  const sScore = data.sipsungScores[ss] ?? 0
                  const sPct = data.totalScore > 0 ? Math.round(sScore / data.totalScore * 1000) / 10 : 0
                  return (
                    <div key={ss} className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs text-gray-400">{ss}</span>
                      <span className="text-xs font-medium w-9 text-right">{sPct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 신강신약 게이지
// ─────────────────────────────────────────────
function StrengthGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  // 반원 게이지: 왼쪽 끝(v=0) → 위 꼭대기(v=50) → 오른쪽 끝(v=100)
  // SVG 좌표계(y↓)에서 반시계 방향 각도: theta = (1 - v/100) * π
  const cx = 80, cy = 74, r = 54
  const theta = (1 - v / 100) * Math.PI
  const ex = cx + r * Math.cos(theta)
  const ey = cy - r * Math.sin(theta)   // y 반전: SVG는 y↓

  let label = '중화한 사주입니다.', color = '#22c55e'
  if (v < 40)  { label = '신약한 사주입니다.'; color = '#f59e0b' }
  if (v > 60)  { label = '신강한 사주입니다.'; color = '#3b82f6' }

  const startX = cx - r, startY = cy  // (26, 74) — 왼쪽 끝
  return (
    <div className="flex flex-col items-center py-4">
      <svg width="160" height="108" viewBox="0 0 160 108">
        {/* 배경 반원 */}
        <path d={`M${startX} ${startY} A${r} ${r} 0 0 1 ${cx+r} ${startY}`}
          fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round"/>
        {/* 채워진 반원 */}
        {v > 0 && (
          <path d={`M${startX} ${startY} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
            fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>
        )}
        {/* 점수 */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#111827">{v}</text>
        {/* 라벨 — 게이지 아래 여백 확보 */}
        <text x={startX}   y="98" textAnchor="middle" fontSize="9" fill="#f59e0b">신약</text>
        <text x={cx}       y="98" textAnchor="middle" fontSize="9" fill="#22c55e">중화</text>
        <text x={cx + r}   y="98" textAnchor="middle" fontSize="9" fill="#3b82f6">신강</text>
      </svg>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
      <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"/>신약 (0~39)</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"/>중화 (40~60)</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"/>신강 (61~)</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 신강신약 탭 (게이지만, 대운 없음)
// ─────────────────────────────────────────────
function TabSingang({ data }: { data: ManseryeokData }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-2">
        신강신약 <HelpTooltip text={'일간의 힘이 사주 안에서 얼마나 강한지 보는 지표입니다.\n비겁과 인성의 힘을 중심으로 계산합니다.\n신강은 자기 힘이 비교적 강한 상태입니다.\n신약은 외부 도움의 영향이 큰 상태입니다.'} />
      </h2>
      <StrengthGauge value={data.strength} />
    </div>
  )
}

// ─────────────────────────────────────────────
// 대운수 탭 — 대운 / 세운 / 월운
// ─────────────────────────────────────────────
// RunCard 내부 행 높이에 맞춘 레이블 컬럼
// - text-xs leading-none ≈ 12px
// - text-[10px] leading-none ≈ 10px
// - GanjiBadge small (w-9 h-9 + gap-0.5 + text-[9px]) ≈ 47px
function RunRowLabels({ topLabel = '나이' }: { topLabel?: string }) {
  const base = 'text-[10px] text-gray-400 leading-none flex items-center justify-end'
  return (
    <div className="flex flex-col items-end gap-1 py-2 pr-2 shrink-0">
      <span className={base} style={{ height: '12px' }}>{topLabel}</span>
      <span className={base} style={{ height: '10px' }} />
      <span className={base} style={{ height: '47px' }}>천간</span>
      <span className={base} style={{ height: '47px' }}>지지</span>
      <span className={base} style={{ height: '10px' }}>십성</span>
      <span className={base} style={{ height: '10px' }}>12운성</span>
    </div>
  )
}

function RunSection({ title, children, topLabel = '나이', help }: { title: string; children: React.ReactNode; topLabel?: string; help?: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-2">{title}{help && <> <HelpTooltip text={help} /></>}</h3>
      <div className="flex items-start">
        <RunRowLabels topLabel={topLabel} />
        <div className="overflow-x-auto flex-1">
          <div className="flex gap-1.5 pb-1" style={{ minWidth: 'max-content' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabDaYunSu({ data }: { data: ManseryeokData }) {
  return (
    <div className="flex flex-col gap-6">
      <RunSection title="대운" topLabel="나이" help={'약 10년 단위로 바뀌는 큰 흐름입니다.\n표시된 나이부터 해당 운이 시작됩니다.\n인생의 방향과 환경 변화를 볼 때 참고합니다.'}>
        {([...data.daYun] as DaYunCard[]).reverse().map(c => (
          <RunCard key={c.ageLabel} label={c.ageLabel} card={c} />
        ))}
      </RunSection>

      <RunSection title="세운" topLabel="연도" help={'해마다 바뀌는 1년 단위 운입니다.\n원국과 만나 그해의 분위기를 만듭니다.\n연도별 흐름을 볼 때 참고합니다.'}>
        {([...data.seWun] as SeWunCard[]).reverse().map(c => (
          <RunCard key={c.year} label={String(c.year)} card={c} />
        ))}
      </RunSection>

      <RunSection title="월운" topLabel="월" help={'매달 바뀌는 한 달 단위 운입니다.\n세운 안에서 월별 흐름을 더 세밀하게 봅니다.\n현재 연도를 기준으로 표시됩니다.'}>
        {([...data.moonCards] as MoonCard[]).reverse().map(c => (
          <RunCard key={c.month} label={`${c.month}월`} card={c} />
        ))}
      </RunSection>
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────
const TABS = [
  { id: 'sajuwonguk', label: '사주원국' },
  { id: 'ohang',     label: '오행과 십성' },
  { id: 'singang',   label: '신강신약' },
  { id: 'dayun',     label: '대운수' },
] as const
type TabId = typeof TABS[number]['id']

export default function ManseryeokResult({ data }: { data: ManseryeokData }) {
  const [tab, setTab] = useState<TabId>('sajuwonguk')
  const pad = (n: number) => String(n).padStart(2, '0')

  const solarStr = `${data.solarYear}. ${pad(data.solarMonth)}. ${pad(data.solarDay)}`
    + (data.solarHour !== null ? ` (${pad(data.solarHour)}:${pad(data.solarMinute ?? 0)})` : '')
  const lunarStr = `${data.lunarYear}. ${data.isLunarLeap ? '윤' : ''}${pad(data.lunarMonth)}. ${pad(data.lunarDay)}`
    + (data.solarHour !== null ? ` (${pad(data.solarHour)}:${pad(data.solarMinute ?? 0)})` : '')

  const [,, dayPillar] = data.pillars
  const dayCN = KR_TO_CN_CHEONGAN[dayPillar.cheonganKR] ?? dayPillar.cheonganCN

  return (
    <div>
      {/* 프로필 */}
      <div className="flex flex-col items-center py-5 gap-1.5">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${OHANG_BG[dayPillar.cheonganOhang]?.split(' ')[0] ?? 'bg-gray-100'}`}
          style={{
            color: isYang(dayPillar.cheonganKR) ? '#000000' : '#ffffff',
            textShadow: isYang(dayPillar.cheonganKR)
              ? '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
              : '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          }}
        >
          {dayCN}
        </div>
        <p className="text-sm text-gray-500">
          {data.gender === 'male' ? '남성' : '여성'}
        </p>
        <div className="flex flex-col items-center gap-0.5 text-xs text-gray-500">
          <span><span className="text-gray-400 mr-1.5">양력</span>{solarStr}</span>
          <span><span className="text-gray-400 mr-1.5">음력</span>{lunarStr}</span>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex overflow-x-auto border-b border-gray-100 -mx-4 px-4 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-black text-black' : 'border-transparent text-gray-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sajuwonguk' && <TabSajuWonguk data={data}/>}
      {tab === 'ohang'      && <TabOhang data={data}/>}
      {tab === 'singang'    && <TabSingang data={data}/>}
      {tab === 'dayun'      && <TabDaYunSu data={data}/>}
    </div>
  )
}
