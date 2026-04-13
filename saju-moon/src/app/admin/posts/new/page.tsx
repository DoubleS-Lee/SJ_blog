import PostForm from '@/components/editor/PostForm'

export const metadata = { title: '새 글 작성' }

export default function NewPostPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold mb-6">새 글 작성</h1>
      <PostForm />
    </div>
  )
}
