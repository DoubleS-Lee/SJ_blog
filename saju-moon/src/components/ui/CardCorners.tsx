const C = '#C4A24E'
const S = 13
const T = '1.5px'
const I = 7

export function CardCorners() {
  return (
    <>
      <div aria-hidden="true" style={{ position: 'absolute', top: I, left: I, width: S, height: S, borderTop: `${T} solid ${C}`, borderLeft: `${T} solid ${C}`, pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: I, right: I, width: S, height: S, borderTop: `${T} solid ${C}`, borderRight: `${T} solid ${C}`, pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: I, left: I, width: S, height: S, borderBottom: `${T} solid ${C}`, borderLeft: `${T} solid ${C}`, pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: I, right: I, width: S, height: S, borderBottom: `${T} solid ${C}`, borderRight: `${T} solid ${C}`, pointerEvents: 'none' }} />
    </>
  )
}
