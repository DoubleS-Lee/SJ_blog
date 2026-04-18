import type { ConsultationStatus } from '@/types/consultation'

const STATUS_MAP: Record<ConsultationStatus, { label: string; className: string }> = {
  submitted: {
    label: '접수됨',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  answered: {
    label: '답변 완료',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  closed: {
    label: '상담 종결',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
}

export default function ConsultationStatusBadge({ status }: { status: ConsultationStatus }) {
  const item = STATUS_MAP[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  )
}
