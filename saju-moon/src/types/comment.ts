export interface CommentNode {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  author_name: string
  author_avatar_url: string | null
  author_ilgan: string | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  like_count: number
  liked_by_me: boolean
  replies: CommentNode[]
}
