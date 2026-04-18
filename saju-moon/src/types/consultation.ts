export type ConsultationStatus = 'submitted' | 'answered' | 'closed'

export interface ConsultationComment {
  id: string
  consultation_id: string
  user_id: string
  author_avatar_url: string | null
  author_ilgan: string | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  role_label: '작성자' | '상담자'
  is_mine: boolean
}

export interface ConsultationRecord {
  id: string
  user_id: string
  title: string
  body: string
  status: ConsultationStatus
  content_usage_agreed: boolean
  content_usage_agreed_at: string
  content_usage_version: string
  admin_note: string | null
  anonymized_content: string | null
  is_external_use_ready: boolean
  created_at: string
  updated_at: string
}
